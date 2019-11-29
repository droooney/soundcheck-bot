import * as _ from 'lodash';
import moment = require('moment-timezone');
import { Context } from 'koa';
import { Op } from 'sequelize';

import {
  SendVkMessageOptions,

  generateRandomCaption,
  getClickStats,
  getGroupStats,
  getHolidays,
  getConcerts,
  getConcertsByDays,
  getConcertsByDaysStrings,
  getConcertsString,
  getDailyConcerts,
  getDayString,
  getPostId,
  getRepostPostId,
  getRepostStats,
  getSubscriptionStats,
  getVkUser,
  getWeeklyConcerts,
  sendVKMessage,
  sendVkMessageToAllConversations,
  sendVkMessageToSubscribedUsers,
  sendVKMessages,
} from './helpers';
import {
  BackButtonDest,
  Body,
  ButtonColor,
  ButtonPayload,
  PhotoAttachment,
  Subscription,
  UserState,
} from './types';
import {
  captions,
  genreNames,
  genreMatches,
  subscriptionHashtags,
  positiveAnswers,
  negativeAnswers,
  services,
} from './constants';
import {
  generateButton,
  generateBackButton,
  generateMainKeyboard,
  generatePosterKeyboard,
  generateWeekPosterKeyboard,
  generatePlaylistsKeyboard,
  generateTextMaterialsKeyboard,
  generateAudioMaterialsKeyboard,
  generateDrawingsKeyboard,
  generateSubscriptionsKeyboard,
  generateAdminDrawingsKeyboard,
  generateAdminDrawingMenuKeyboard,

  subscriptionMap,
  genresKeyboard,
  servicesKeyboard,
  writeToSoundcheckKeyboard,
  adminKeyboard,
  adminStatsKeyboard,
  adminSubscriptionStatsKeyboard,
  adminClickStatsKeyboard,
  adminGroupStatsKeyboard,
  adminRepostStatsKeyboard,
  adminSendMessageToUsersKeyboard,
} from './keyboards';
import config from './config';
import sequelize from './database';
import User from './database/User';
import Drawing from './database/Drawing';
import Click from './database/Click';
import GroupUser from './database/GroupUser';
import Repost from './database/Repost';

export default async (ctx: Context) => {
  const body: Body = ctx.request.body;
  const requestTime = moment();
  const latestClickTime = requestTime.clone().subtract(1, 'minute');

  console.log('bot event', requestTime.format('YYYY-MM-DD HH:mm:ss.SSS'), body);

  eventHandler: if (body.type === 'confirmation') {
    ctx.body = config.confirmationCode;
  } else if (body.type === 'message_new') {
    const messageId = body.object.id;
    const vkId = body.object.peer_id;
    const text = body.object.text;
    const isManager = ctx.managers.includes(vkId);
    const mainKeyboard = generateMainKeyboard(isManager);
    const respond = async (message: string, options: SendVkMessageOptions = {}) => {
      await sendVKMessage(vkId, message, {
        randomId: body.object.conversation_message_id,
        ...options
      });
    };
    let isNewUser = false;
    const user = await User.findOne({ where: { vkId } }) || await (async () => {
      const vkUser = await getVkUser(vkId);

      isNewUser = true;

      return User.add({
        vkId,
        ...User.getVkUserData(vkUser)
      });
    })();
    const userState = user.state;
    const newLastMessageDate = new Date(body.object.date * 1000);
    let buttonPayload: ButtonPayload | null = null;
    let payload: ButtonPayload | UserState | null = null;

    if (body.object.payload) {
      try {
        buttonPayload = payload = JSON.parse(body.object.payload);
      } catch (err) {}
    }

    if (
      !isManager
      && buttonPayload
      && buttonPayload.command !== 'start'
      && buttonPayload.command !== 'back'
      && buttonPayload.command !== 'poster/subscribe'
      && buttonPayload.command !== 'playlists/subscribe'
      && buttonPayload.command !== 'text_materials/subscribe'
      && buttonPayload.command !== 'audio_materials/subscribe'
      && buttonPayload.command !== 'drawings/subscribe'
      && !buttonPayload.command.startsWith('subscriptions')
      && !buttonPayload.command.startsWith('write_to_soundcheck')
      && !buttonPayload.command.startsWith('admin')
    ) {
      try {
        const userClicks = await Click.findAll({
          where: {
            vkId,
            createdAt: {
              [Op.gte]: latestClickTime.toDate()
            }
          }
        });

        if (userClicks.every((click) => !_.isEqual(click.payload, payload))) {
          await Click.add({
            vkId,
            payload: buttonPayload
          });
        }
      } catch (err) {
        console.log('save click error', err);
      }
    }

    if (!payload) {
      payload = userState;
    }

    if (user.lastMessageDate > newLastMessageDate) {
      ctx.body = 'ok';

      break eventHandler;
    }

    message: if (payload) {
      if ((payload.command.startsWith('admin') || (payload.command === 'back' && payload.dest.startsWith('admin'))) && !isManager) {
        await respond(captions.you_re_not_a_manager, { keyboard: mainKeyboard });

        break message;
      }

      if (payload.command === 'start') {
        await respond(captions.welcome_text(user), { keyboard: mainKeyboard });
      } else if (payload.command === 'back' && payload.dest === BackButtonDest.MAIN) {
        const buttonsCount = mainKeyboard.buttons.reduce((count, buttons) => count + buttons.length, 0);

        await respond(generateRandomCaption(captions.back_to_main_menu, { user, buttonsCount }), { keyboard: mainKeyboard });
      } else if (payload.command === 'poster') {
        await respond(generateRandomCaption(captions.choose_poster_type, { user }), { keyboard: generatePosterKeyboard(user) });
      } else if (payload.command === 'back' && payload.dest === BackButtonDest.POSTER) {
        await respond(generateRandomCaption(captions.back_to_poster, { user }), { keyboard: generatePosterKeyboard(user) });
      } else if (payload.command === 'poster/type') {
        if (payload.type === 'day') {
          const upcomingConcerts = await getConcerts(moment().startOf('day'));

          if (!upcomingConcerts.length) {
            await respond(captions.no_concerts_by_day);

            break message;
          }

          const concertsByDays = getConcertsByDays(upcomingConcerts);
          const days: number[] = [];

          _.forEach(concertsByDays, (_, day) => {
            if (days.length === 28) {
              return false;
            }

            days.push(+day);
          });

          const holidays = await getHolidays(moment(days[0]), moment(_.last(days)));
          const buttons = days.map((day) => {
            const dayMoment = moment(+day);
            const dayOfTheWeek = dayMoment.weekday();

            return generateButton(
              getDayString(dayMoment),
              { command: 'poster/type/day', dayStart: +day },
              dayOfTheWeek > 4 || holidays.some((holiday) => holiday.isSame(dayMoment, 'day')) ? ButtonColor.POSITIVE : ButtonColor.PRIMARY
            );
          });

          await respond(generateRandomCaption(captions.choose_day), {
            keyboard: {
              one_time: false,
              buttons: [
                ..._.chunk(buttons, 4),
                [generateBackButton(BackButtonDest.POSTER)],
                [generateBackButton()],
              ]
            }
          });
        } else if (payload.type === 'week') {
          await respond(captions.choose_week, { keyboard: generateWeekPosterKeyboard() });
        } else if (payload.type === 'genres') {
          await respond(captions.choose_genre, { keyboard: genresKeyboard });
        }
      } else if (payload.command === 'poster/type/day') {
        const date = moment(payload.dayStart);
        const concerts = await getDailyConcerts(date);

        await respond(
          concerts.length
            ? captions.concerts_at_day(date, getConcertsString(concerts))
            : captions.no_concerts_at_day
        );
      } else if (payload.command === 'poster/type/week') {
        const today = +moment().startOf('day');
        const concerts = (await getWeeklyConcerts(moment(payload.weekStart))).filter(({ startTime }) => +startTime >= today);

        if (!concerts.length) {
          await respond(captions.no_concerts_at_week);

          break message;
        }

        const groups = getConcertsByDays(concerts);
        const concertsStrings = getConcertsByDaysStrings(groups);

        for (const concertsString of concertsStrings) {
          await respond(concertsString);
        }
      } else if (payload.command === 'poster/type/genre') {
        const genre = payload.genre;
        const allConcerts = await getConcerts(moment().startOf('day'));
        const genreConcerts = allConcerts.filter(({ genres }) => (
          genres.some((g) => g.toLowerCase() === genreNames[genre].toLowerCase() || genreMatches[genre].includes(g.toLowerCase()))
        ));

        if (!genreConcerts.length) {
          await respond(captions.no_concerts_in_genre(genre));

          break message;
        }

        const groups = getConcertsByDays(genreConcerts);
        const concertsStrings = getConcertsByDaysStrings(groups);

        for (const concertsString of concertsStrings) {
          await respond(concertsString);
        }
      } else if (payload.command === 'playlists') {
        await respond(captions.choose_playlists_type, { keyboard: generatePlaylistsKeyboard(user) });
      } else if (payload.command === 'playlists/all') {
        await respond(captions.playlists_all_response);
      } else if (payload.command === 'playlists/thematic') {
        await respond(captions.playlists_thematic_response);
      } else if (payload.command === 'playlists/genre') {
        await respond(captions.playlists_genres_response);
      } else if (payload.command === 'releases') {
        await respond(captions.releases_response);
      } else if (payload.command === 'drawings') {
        const keyboard = await generateDrawingsKeyboard(user);
        const hasDrawings = keyboard.buttons.some((buttons) => (
          buttons.some(({ action }) => (
            !!action.payload && (JSON.parse(action.payload) as ButtonPayload).command === 'drawings/drawing'
          ))
        ));

        await respond(
          hasDrawings ? captions.choose_drawing : captions.no_drawings,
          { keyboard: await generateDrawingsKeyboard(user) }
        );
      } else if (payload.command === 'drawings/drawing') {
        const drawing = await Drawing.findByPk(payload.drawingId);

        if (drawing) {
          await respond(drawing.name, {
            attachments: [{ type: 'wall', id: drawing.postId }]
          });
        } else {
          await respond(captions.no_drawing, { keyboard: await generateDrawingsKeyboard(user) });
        }
      } else if (payload.command === 'text_materials') {
        await respond(captions.text_materials_response, { keyboard: generateTextMaterialsKeyboard(user) });
      } else if (payload.command === 'text_materials/longread') {
        await respond(captions.longreads_response);
      } else if (payload.command === 'text_materials/group_history') {
        await respond(captions.group_history_response);
      } else if (payload.command === 'audio_materials') {
        await respond(captions.audio_materials_response, { keyboard: generateAudioMaterialsKeyboard(user) });
      } else if (payload.command === 'audio_materials/digests') {
        await respond(captions.digests_response);
      } else if (payload.command === 'audio_materials/podcasts') {
        await respond(captions.podcasts_response);
      } else if (payload.command === 'write_to_soundcheck') {
        await respond(captions.write_to_soundcheck_response, { keyboard: writeToSoundcheckKeyboard });
      } else if (payload.command === 'write_to_soundcheck/tell_about_group') {
        user.state = {
          command: 'write_to_soundcheck/tell_about_group/message'
        };

        await respond(captions.tell_about_group_response);
      } else if (payload.command === 'write_to_soundcheck/tell_about_group/message') {
        await Promise.all([
          respond(captions.tell_about_group_message_response),
          sendVKMessage(config.targets.tellAboutGroup, captions.group_history_message, {
            forwardMessages: [messageId]
          })
        ]);
      } else if (payload.command === 'write_to_soundcheck/tell_about_release') {
        user.state = {
          command: 'write_to_soundcheck/tell_about_release/message'
        };

        await respond(captions.tell_about_release_response);
      } else if (payload.command === 'write_to_soundcheck/tell_about_release/message') {
        await Promise.all([
          respond(captions.tell_about_release_message_response),
          sendVKMessage(config.targets.tellAboutRelease, captions.release_message, {
            forwardMessages: [messageId]
          })
        ]);
      } else if (payload.command === 'write_to_soundcheck/collaboration') {
        user.state = {
          command: 'write_to_soundcheck/collaboration/message'
        };

        await respond(captions.collaboration_response);
      } else if (payload.command === 'write_to_soundcheck/collaboration/message') {
        await Promise.all([
          respond(captions.collaboration_message_response),
          sendVKMessage(config.targets.collaboration, captions.collaboration_message, {
            forwardMessages: [messageId]
          })
        ]);
      } else if (payload.command === 'write_to_soundcheck/tell_about_bug') {
        user.state = {
          command: 'write_to_soundcheck/tell_about_bug/message'
        };

        await respond(captions.tell_about_bug_response);
      } else if (payload.command === 'write_to_soundcheck/tell_about_bug/message') {
        await Promise.all([
          respond(captions.tell_about_bug_message_response),
          sendVKMessage(config.targets.tellAboutBug, captions.tell_about_bug_message, {
            forwardMessages: [messageId]
          })
        ]);
      } else if (payload.command === 'write_to_soundcheck/want_to_participate') {
        user.state = {
          command: 'write_to_soundcheck/want_to_participate/message'
        };

        await respond(captions.want_to_participate_response);
      } else if (payload.command === 'write_to_soundcheck/want_to_participate/message') {
        await Promise.all([
          respond(captions.want_to_participate_message_response),
          sendVKMessage(config.targets.wantToParticipate, captions.want_to_participate_message, {
            forwardMessages: [messageId]
          })
        ]);
      } else if (payload.command === 'write_to_soundcheck/other') {
        user.state = {
          command: 'write_to_soundcheck/other/message'
        };

        await respond(captions.write_to_soundcheck_other_response);
      } else if (payload.command === 'write_to_soundcheck/other/message') {
        await Promise.all([
          respond(captions.write_to_soundcheck_other_message_response),
          sendVKMessage(config.targets.other, captions.write_to_soundcheck_other_message, {
            forwardMessages: [body.object.id]
          })
        ]);
      } else if (payload.command === 'services') {
        await respond(captions.choose_service, { keyboard: servicesKeyboard });
      } else if (payload.command === 'services/service') {
        const { message, attachments } = services[payload.service];

        await respond(message, { attachments });
      } else if (payload.command === 'subscriptions') {
        await respond(captions.subscriptions_response(user), { keyboard: generateSubscriptionsKeyboard(user) });
      } else if (payload.command === 'subscriptions/subscription') {
        if (payload.subscribed) {
          user.unsubscribe(payload.subscription);

          await user.save();
          await respond(captions.unsubscribe_response(payload.subscription), { keyboard: generateSubscriptionsKeyboard(user) });
        } else {
          user.subscribe(payload.subscription);

          await user.save();
          await respond(captions.subscribe_response(payload.subscription), { keyboard: generateSubscriptionsKeyboard(user) });
        }
      } else if (
        payload.command === 'poster/subscribe'
        || payload.command === 'playlists/subscribe'
        || payload.command === 'text_materials/subscribe'
        || payload.command === 'audio_materials/subscribe'
        || payload.command === 'drawings/subscribe'
      ) {
        const { subscription, generateKeyboard } = subscriptionMap[payload.command];

        if (payload.subscribed) {
          user.unsubscribe(subscription);

          await user.save();
          await respond(captions.unsubscribe_response(subscription), { keyboard: await generateKeyboard(user) });
        } else {
          user.subscribe(subscription);

          await user.save();
          await respond(captions.subscribe_response(subscription), { keyboard: await generateKeyboard(user) });
        }
      } else if (payload.command === 'admin' || (payload.command === 'back' && payload.dest === BackButtonDest.ADMIN)) {
        await respond(captions.choose_action, { keyboard: adminKeyboard });
      } else if (payload.command === 'admin/drawings' || (payload.command === 'back' && payload.dest === BackButtonDest.ADMIN_DRAWINGS)) {
        await respond(captions.choose_or_add_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
      } else if (payload.command === 'admin/drawings/add') {
        user.state = {
          command: 'admin/drawings/add/set_name'
        };

        await respond(captions.enter_drawing_name);
      } else if (payload.command === 'admin/drawings/add/set_name') {
        user.state = {
          command: 'admin/drawings/add/set_post',
          name: text
        };

        await respond(captions.send_drawing_post);
      } else if (payload.command === 'admin/drawings/add/set_post') {
        const postId = getPostId(body.object);

        if (postId) {
          user.state = {
            command: 'admin/drawings/add/set_expires_at',
            name: payload.name,
            postId
          };

          await respond(captions.enter_drawing_expires_at, { keyboard: await generateAdminDrawingsKeyboard() });
        } else {
          user.state = { ...payload };

          await respond(captions.send_drawing_post);
        }
      } else if (payload.command === 'admin/drawings/add/set_expires_at') {
        const expiresAt = moment(text, 'DD.MM');

        if (expiresAt.isBefore(requestTime)) {
          expiresAt.add(1, 'year');
        }

        if (expiresAt.isValid() && expiresAt.isAfter(requestTime)) {
          await Drawing.add({
            name: payload.name,
            postId: payload.postId,
            expiresAt: expiresAt.toDate()
          });
          await respond(captions.drawing_added, { keyboard: await generateAdminDrawingsKeyboard() });
        } else {
          user.state = { ...payload };

          await respond(captions.enter_drawing_expires_at);
        }
      } else if (payload.command === 'admin/drawings/drawing') {
        const drawing = await Drawing.findByPk(payload.drawingId);

        if (drawing) {
          await respond(`${drawing.name} (окончание розыгрыша - ${moment(drawing.expiresAt).format('DD MMMM YYYY')})`, {
            attachments: [{ type: 'wall', id: drawing.postId }],
            keyboard: generateAdminDrawingMenuKeyboard(drawing)
          });
        } else {
          await respond(captions.no_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
        }
      } else if (payload.command === 'admin/drawings/drawing/edit_name') {
        const drawing = await Drawing.findByPk(payload.drawingId);

        if (drawing) {
          user.state = {
            command: 'admin/drawings/drawing/edit_name/message',
            drawingId: payload.drawingId
          };

          await respond(captions.enter_drawing_name);
        } else {
          await respond(captions.no_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
        }
      } else if (payload.command === 'admin/drawings/drawing/edit_name/message') {
        const drawing = await Drawing.findByPk(payload.drawingId);

        if (drawing) {
          drawing.name = text;

          await drawing.save();
          await respond(captions.drawing_edited);
        } else {
          await respond(captions.no_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
        }
      } else if (payload.command === 'admin/drawings/drawing/edit_post') {
        const drawing = await Drawing.findByPk(payload.drawingId);

        if (drawing) {
          user.state = {
            command: 'admin/drawings/drawing/edit_post/message',
            drawingId: payload.drawingId
          };

          await respond(captions.send_drawing_post);
        } else {
          await respond(captions.no_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
        }
      } else if (payload.command === 'admin/drawings/drawing/edit_post/message') {
        const drawing = await Drawing.findByPk(payload.drawingId);

        if (drawing) {
          const postId = getPostId(body.object);

          if (postId) {
            drawing.postId = postId;

            await drawing.save();
            await respond(captions.drawing_edited);
          } else {
            user.state = { ...payload };

            await respond(captions.send_drawing_post);
          }
        } else {
          await respond(captions.no_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
        }
      } else if (payload.command === 'admin/drawings/drawing/edit_expires_at') {
        const drawing = await Drawing.findByPk(payload.drawingId);

        if (drawing) {
          user.state = {
            command: 'admin/drawings/drawing/edit_expires_at/message',
            drawingId: payload.drawingId
          };

          await respond(captions.enter_drawing_expires_at);
        } else {
          await respond(captions.no_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
        }
      } else if (payload.command === 'admin/drawings/drawing/edit_expires_at/message') {
        const drawing = await Drawing.findByPk(payload.drawingId);

        if (drawing) {
          const expiresAt = moment(text, 'DD.MM');

          if (expiresAt.isBefore(requestTime)) {
            expiresAt.add(1, 'year');
          }

          if (expiresAt.isValid() && expiresAt.isAfter(requestTime)) {
            drawing.expiresAt = expiresAt.toDate();

            await drawing.save();
            await respond(captions.drawing_edited);
          } else {
            user.state = { ...payload };

            await respond(captions.enter_drawing_expires_at);
          }
        } else {
          await respond(captions.no_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
        }
      } else if (payload.command === 'admin/drawings/drawing/delete') {
        const drawing = await Drawing.findByPk(payload.drawingId);

        if (drawing) {
          user.state = {
            command: 'admin/drawings/drawing/delete/confirmation',
            drawingId: payload.drawingId
          };

          await respond(captions.confirm_drawing_delete(drawing));
        } else {
          await respond(captions.no_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
        }
      } else if (payload.command === 'admin/drawings/drawing/delete/confirmation') {
        const drawing = await Drawing.findByPk(payload.drawingId);

        if (drawing) {
          if (positiveAnswers.includes(text.toLowerCase())) {
            drawing.active = false;

            await drawing.save();
            await respond(captions.drawing_deleted, { keyboard: await generateAdminDrawingsKeyboard() });
          } else {
            await respond(captions.choose_action, { keyboard: generateAdminDrawingMenuKeyboard(drawing) });
          }
        } else {
          await respond(captions.no_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
        }
      } else if (payload.command === 'admin/stats' || (payload.command === 'back' && payload.dest === BackButtonDest.ADMIN_STATS)) {
        await respond(captions.stats_response, { keyboard: adminStatsKeyboard });
      } else if (payload.command === 'admin/stats/subscriptions') {
        await respond(captions.choose_period, { keyboard: adminSubscriptionStatsKeyboard });
      } else if (payload.command === 'admin/stats/subscriptions/period') {
        await respond(await getSubscriptionStats(payload.period));
      } else if (payload.command === 'admin/stats/clicks') {
        await respond(captions.choose_period, { keyboard: adminClickStatsKeyboard });
      } else if (payload.command === 'admin/stats/clicks/period') {
        await respond(await getClickStats(payload.period));
      } else if (payload.command === 'admin/stats/group') {
        await respond(captions.choose_period, { keyboard: adminGroupStatsKeyboard });
      } else if (payload.command === 'admin/stats/group/period') {
        await respond(await getGroupStats(payload.period));
      } else if (payload.command === 'admin/stats/reposts') {
        await respond(captions.choose_period, { keyboard: adminRepostStatsKeyboard });
      } else if (payload.command === 'admin/stats/reposts/period') {
        await respond(await getRepostStats(payload.period));
      } else if (payload.command === 'admin/send_message_to_users') {
        await respond(captions.choose_group, { keyboard: adminSendMessageToUsersKeyboard });
      } else if (payload.command === 'admin/send_message_to_users/group') {
        if (payload.group === 'pick') {
          user.state = {
            command: 'admin/send_message_to_users/group/set_group'
          };

          await respond(captions.enter_user_ids);
        } else {
          user.state = {
            command: 'admin/send_message_to_users/group/set_text',
            group: payload.group
          };

          await respond(captions.enter_message_text);
        }
      } else if (payload.command === 'admin/send_message_to_users/group/set_group') {
        const userIds = text.split(/(?:\s*,\s*|\s+)/).filter((id) => /^\d+$/.test(id)).map((id) => +id);

        if (userIds.length) {
          user.state = {
            command: 'admin/send_message_to_users/group/set_text',
            group: userIds
          };

          await respond(captions.enter_message_text);
        } else {
          user.state = { ...payload };

          await respond(captions.enter_user_ids);
        }
      } else if (payload.command === 'admin/send_message_to_users/group/set_text') {
        user.state = {
          command: 'admin/send_message_to_users/group/set_post',
          group: payload.group,
          text
        };

        await respond(captions.enter_message_post);
      } else if (payload.command === 'admin/send_message_to_users/group/set_post') {
        const postId = getPostId(body.object);

        if (postId || negativeAnswers.includes(text.toLowerCase())) {
          user.state = {
            command: 'admin/send_message_to_users/group/set_image',
            group: payload.group,
            text: payload.text,
            post: postId
          };

          await respond(captions.enter_message_image);
        } else {
          user.state = { ...payload };

          await respond(captions.enter_message_post);
        }
      } else if (payload.command === 'admin/send_message_to_users/group/set_image') {
        const photoAttachment = (body.object.attachments.find(({ type }) => type === 'photo') || null) as PhotoAttachment | null;

        if (photoAttachment || negativeAnswers.includes(text.toLowerCase())) {
          user.state = {
            command: 'admin/send_message_to_users/group/set_refresh_keyboard',
            group: payload.group,
            text: payload.text,
            post: payload.post,
            image: photoAttachment && `${photoAttachment.photo.owner_id}_${photoAttachment.photo.id}`
          };

          await respond(captions.need_to_refresh_keyboard);
        } else {
          user.state = { ...payload };

          await respond(captions.enter_message_image);
        }
      } else if (payload.command === 'admin/send_message_to_users/group/set_refresh_keyboard') {
        const isPositiveAnswer = positiveAnswers.includes(text.toLowerCase());
        const isNegativeAnswer = negativeAnswers.includes(text.toLowerCase());

        if (isPositiveAnswer || isNegativeAnswer) {
          const sendOptions: SendVkMessageOptions = {
            attachments: [
              ...(payload.post ? [{ type: 'wall' as 'wall', id: payload.post }] : []),
              ...(payload.image ? [{ type: 'photo' as 'photo', id: payload.image }] : []),
            ],
            keyboard: isPositiveAnswer
              ? generateMainKeyboard(false)
              : undefined
          };

          if (payload.group === 'all') {
            await sendVkMessageToAllConversations(payload.text, sendOptions);
          } else if (typeof payload.group === 'string') {
            await sendVkMessageToSubscribedUsers([payload.group], payload.text, sendOptions);
          } else {
            await sendVKMessages(payload.group, payload.text, sendOptions);
          }

          await respond(captions.message_successfully_sent);
        } else {
          user.state = { ...payload };

          await respond(captions.need_to_refresh_keyboard);
        }
      } else {
        console.warn('warning: unknown payload', payload);

        await respond(captions.choose_action, { keyboard: mainKeyboard });
      }
    } else if (isNewUser) {
      await respond(captions.welcome_text(user), { keyboard: mainKeyboard });
    }

    user.lastMessageDate = newLastMessageDate;
    user.state = user.state === userState
      ? null
      : user.state;

    await user.save();

    ctx.body = 'ok';
  } else if (body.type === 'group_officers_edit') {
    const {
      user_id,
      level_new
    } = body.object;

    const newManagers = ctx.managers.filter((id) => id !== user_id);

    if (level_new > 1) {
      newManagers.push(user_id);
    }

    ctx.changeManagers(newManagers);

    ctx.body = 'ok';
  } else if (
    body.type === 'group_leave'
    || (body.type === 'group_join' && (body.object.join_type === 'join' || body.object.join_type === 'accepted'))
  ) {
    const vkId = body.object.user_id;
    const status = body.type === 'group_join';
    const now = moment();
    const startOfDay = now.startOf('day').toDate();
    const endOfDay = now.endOf('day').toDate();

    await sequelize.transaction(async (transaction) => {
      const groupUser = await GroupUser.findOne({
        where: {
          vkId,
          createdAt: {
            [Op.gte]: startOfDay,
            [Op.lte]: endOfDay
          },
        },
        transaction
      });

      if (groupUser) {
        if (groupUser.status === status) {
          await groupUser.save({ transaction });
        } else {
          await groupUser.destroy({ transaction });
        }
      } else {
        await GroupUser.add({ vkId, status }, { transaction });
      }
    });

    ctx.body = 'ok';
  } else if (body.type === 'wall_post_new') {
    const photoAttachment = (body.object.attachments || []).find(({ type }) => type === 'photo') as PhotoAttachment | undefined;

    if (photoAttachment) {
      const postId = `${body.object.owner_id}_${body.object.id}`;
      const hashtags = photoAttachment.photo.text
        .split(/\s+/)
        .map((hashtag) => hashtag.trim())
        .filter(Boolean);
      const subscriptions = _.filter(Subscription, (subscription) => (
        subscriptionHashtags[subscription].some((hashtag) => hashtags.includes(hashtag))
      ));

      await sendVkMessageToSubscribedUsers(subscriptions, '', {
        attachments: [{ type: 'wall', id: postId }],
        randomId: 2n ** 30n + BigInt(body.object.id),
      });
    }

    ctx.body = 'ok';
  } else if (body.type === 'wall_repost') {
    const ownerId = body.object.owner_id;
    const postId = body.object.id;
    const originalPostId = getRepostPostId(body.object);

    if (originalPostId) {
      const existingPost = await Repost.findOne({
        where: { ownerId, postId, originalPostId }
      });

      if (!existingPost) {
        await Repost.add({ ownerId, postId, originalPostId });
      }
    }

    ctx.body = 'ok';
  } else {
    ctx.body = 'ok';
  }
}
