import * as _ from 'lodash';
import moment = require('moment-timezone');
import { Context } from 'koa';
import { Op } from 'sequelize';

import {
  SendVkMessageOptions,

  generateRandomCaption,
  getClickStats,
  getGroupStats,
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
  getWeekString,
  getWeeklyConcerts,
  isConcertInGenre,
  isNumbersArray,
  sendVKMessage,
  sendVkMessageToAllConversations,
  sendVkMessageToSubscribedUsers,
  sendVKMessages,
} from './helpers';
import {
  BackButtonDest,
  Body,
  ButtonPayload,
  Genre,
  Hashtag,
  PhotoAttachment,
  PlaylistGenre,
  Subscription,
  UserState,
} from './types';
import {
  captions,
  hashtagCombinations,
  links,
  negativeAnswers,
  playlistsGenreNames,
  positiveAnswers,
  services,
  subscriptionHashtags,
} from './constants';
import {
  generateMainKeyboard,
  generatePosterKeyboard,
  generateWeekPosterKeyboard,
  generateDayPosterKeyboard,
  generateGenrePosterKeyboard,
  generatePlaylistsKeyboard,
  generateTextMaterialsKeyboard,
  generateReleasesKeyboard,
  generateDrawingsKeyboard,
  generateSubscriptionsKeyboard,
  generateAdminDrawingsKeyboard,
  generateAdminDrawingMenuKeyboard,

  subscriptionMap,
  playlistsGenresKeyboard,
  servicesKeyboard,
  writeToSoundcheckKeyboard,
  soundfestKeyboard,
  adminKeyboard,
  adminStatsKeyboard,
  adminSubscriptionStatsKeyboard,
  adminClickStatsKeyboard,
  adminGroupStatsKeyboard,
  adminRepostStatsKeyboard,
  adminSendMessageToUsersKeyboard,
} from './keyboards';
import config from './config';
import Logger from './Logger';
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

  Logger.log('bot event', body);

  if (body.type === 'confirmation') {
    ctx.body = config.confirmationCode;

    return;
  }

  eventHandler: if (body.type === 'message_new') {
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
      && buttonPayload.command !== 'releases/subscribe'
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
        Logger.log(err, 'save click error');
      }
    }

    if (!payload) {
      payload = userState;
    }

    if (user.lastMessageDate > newLastMessageDate) {
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

          await respond(generateRandomCaption(captions.choose_day), { keyboard: await generateDayPosterKeyboard(concertsByDays) });
        } else if (payload.type === 'week') {
          await respond(generateRandomCaption(captions.choose_week), { keyboard: generateWeekPosterKeyboard() });
        } else if (payload.type === 'genres') {
          const allConcerts = await getConcerts(moment().startOf('day'));

          await respond(generateRandomCaption(captions.choose_genre), { keyboard: generateGenrePosterKeyboard(allConcerts) });
        }
      } else if (payload.command === 'poster/type/day') {
        const date = moment(payload.dayStart);
        const concerts = await getDailyConcerts(date);

        if (!concerts.length) {
          await respond(captions.no_concerts_at_day);

          break message;
        }

        const dateString = getDayString(date);
        const concertsString = getConcertsString(concerts);
        const caption = concerts.length > 1
          ? generateRandomCaption(captions.concerts_at_day, { user, dateString, concertsCount: concerts.length })
          : generateRandomCaption(captions.concert_at_day, { dateString });

        await respond(`${caption}\n\n${concertsString}`);
      } else if (payload.command === 'poster/type/week') {
        const today = +moment().startOf('day');
        const weekStart = moment(payload.weekStart);
        const concerts = (await getWeeklyConcerts(weekStart)).filter(({ startTime }) => +startTime >= today);

        if (!concerts.length) {
          await respond(captions.no_concerts_at_week);

          break message;
        }

        if (concerts.length === 1) {
          await respond(captions.concert_at_week(getWeekString(weekStart)));

          break message;
        }

        const groups = getConcertsByDays(concerts);
        const concertsStrings = getConcertsByDaysStrings(groups, generateRandomCaption(captions.concerts_at_week, {
          user,
          weekString: getWeekString(weekStart),
          concertsCount: concerts.length
        }));

        for (const concertsString of concertsStrings) {
          await respond(concertsString);
        }
      } else if (payload.command === 'poster/type/genre') {
        const genre = payload.genre;
        const allConcerts = await getConcerts(moment().startOf('day'));
        const genreConcerts = allConcerts.filter((concert) => isConcertInGenre(concert, genre));

        if (!genreConcerts.length) {
          await respond(captions.no_concerts_in_genre(genre));

          break message;
        }

        const groups = getConcertsByDays(genreConcerts);
        const concertsStrings = getConcertsByDaysStrings(
          groups,
          genre === Genre.ABOUT_MUSIC
            ? genreConcerts.length === 1
              ? captions.music_event
              : generateRandomCaption(captions.music_events, { user, eventsCount: genreConcerts.length })
            : genreConcerts.length === 1
              ? captions.concert_in_genre(genre)
              : generateRandomCaption(captions.concerts_in_genre, { user, genre, concertsCount: genreConcerts.length })
        );

        for (const concertsString of concertsStrings) {
          await respond(concertsString);
        }
      } else if (payload.command === 'playlists') {
        await respond(generateRandomCaption(captions.playlists_response, { user }), { keyboard: generatePlaylistsKeyboard(user) });
      } else if (payload.command === 'playlists/all') {
        await respond(`${generateRandomCaption(captions.playlists_all_response)}\n\n➡ ${links.playlists_all}`);
      } else if (payload.command === 'playlists/thematic') {
        await respond(`${generateRandomCaption(captions.playlists_thematic_response)}\n\n➡ ${links.playlists_thematic}`);
      } else if (payload.command === 'playlists/genre') {
        const playlists = _.map(PlaylistGenre, (genre) => ({ name: playlistsGenreNames[genre] }));

        await respond(generateRandomCaption(captions.playlists_genres_response, { playlists }), { keyboard: playlistsGenresKeyboard });
      } else if (payload.command === 'playlists/genre/type') {
        const playlist = {
          name: playlistsGenreNames[payload.genre],
          link: links.playlists_genre[payload.genre]
        };

        await respond(`${generateRandomCaption(captions.playlists_genre_response, { user, playlist })}\n\n➡ ${playlist.link}`);
      } else if (payload.command === 'back' && payload.dest === BackButtonDest.PLAYLISTS) {
        await respond(generateRandomCaption(captions.back_to_playlists, { user }), { keyboard: generatePlaylistsKeyboard(user) });
      } else if (payload.command === 'releases') {
        await respond(generateRandomCaption(captions.releases_response, { user }), { keyboard: generateReleasesKeyboard(user) });
      } else if (payload.command === 'releases/week_releases') {
        await respond(`${generateRandomCaption(captions.week_releases_response, { user })}\n\n➡ ${links.releases}`);
      } else if (payload.command === 'releases/digests') {
        await respond(`${generateRandomCaption(captions.digests_response)}\n\n➡ ${links.digests}`);
      } else if (payload.command === 'drawings') {
        const keyboard = await generateDrawingsKeyboard(user);
        const hasDrawings = keyboard.buttons.some((buttons) => (
          buttons.some(({ action }) => (
            !!action.payload && (JSON.parse(action.payload) as ButtonPayload).command === 'drawings/drawing'
          ))
        ));

        await respond(
          hasDrawings
            ? generateRandomCaption(captions.drawings_response, { user })
            : generateRandomCaption(captions.no_drawings, { user }),
          { keyboard }
        );
      } else if (payload.command === 'drawings/drawing') {
        const drawing = await Drawing.findByPk(payload.drawingId);

        if (drawing) {
          await respond(generateRandomCaption(captions.drawing_response, { drawing }), {
            attachments: [{ type: 'wall', id: drawing.postId }]
          });
        } else {
          const [keyboard, drawings] = await Promise.all([
            generateDrawingsKeyboard(user),
            Drawing.getActiveDrawings(),
          ]);

          await respond(
            drawings.length > 1
              ? captions.no_drawing['>1'](drawings)
              : drawings.length
                ? captions.no_drawing[1](drawings[0])
                : captions.no_drawing[0](user),
            { keyboard }
          );
        }
      } else if (payload.command === 'text_materials') {
        await respond(generateRandomCaption(captions.text_materials_response, { user }), { keyboard: generateTextMaterialsKeyboard(user) });
      } else if (payload.command === 'text_materials/longread') {
        await respond(`${generateRandomCaption(captions.longreads_response, { user })}\n\n➡ ${links.longreads}`);
      } else if (payload.command === 'text_materials/group_history') {
        await respond(`${generateRandomCaption(captions.group_history_response, { user })}\n\n➡ ${links.group_history}`);
      } else if (payload.command === 'write_to_soundcheck') {
        await respond(generateRandomCaption(captions.write_to_soundcheck_response, { user }), { keyboard: writeToSoundcheckKeyboard });
      } else if (payload.command === 'write_to_soundcheck/tell_about_group') {
        user.state = {
          command: 'write_to_soundcheck/tell_about_group/message'
        };

        await respond(captions.tell_about_group_response);
      } else if (payload.command === 'write_to_soundcheck/tell_about_group/message') {
        await Promise.all([
          respond(captions.tell_about_group_message_response(user)),
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
          respond(captions.tell_about_release_message_response(user)),
          sendVKMessage(config.targets.tellAboutRelease, captions.release_message, {
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
          respond(captions.tell_about_bug_message_response(user)),
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
          respond(captions.want_to_participate_message_response(user)),
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
          respond(captions.write_to_soundcheck_other_message_response(user)),
          sendVKMessage(config.targets.other, captions.write_to_soundcheck_other_message, {
            forwardMessages: [body.object.id]
          })
        ]);
      } else if (payload.command === 'services') {
        await respond(captions.services_response(user), { keyboard: servicesKeyboard });
      } else if (payload.command === 'services/service') {
        const { message, attachments } = services[payload.service];

        await respond(generateRandomCaption(message, { user }), { attachments });
      } else if (payload.command === 'subscriptions') {
        const subscriptions = user.getActualSubscriptions();
        const allSubscriptions = _.map(Subscription);

        await respond(
          subscriptions.length === allSubscriptions.length
            ? captions.subscriptions_response.all(user)
            : subscriptions.length > 1
              ? captions.subscriptions_response['>1'](user, subscriptions)
              : subscriptions.length
                ? captions.subscriptions_response[1](user, subscriptions[0])
                : generateRandomCaption(captions.subscriptions_response[0], { user }),
          { keyboard: generateSubscriptionsKeyboard(user) }
        );
      } else if (payload.command === 'subscriptions/subscription') {
        if (payload.subscribed) {
          user.unsubscribe(payload.subscription);

          await user.save();
          await respond(
            `${captions.unsubscribe_response(user, payload.subscription)} ${captions.subscribeOrUnsubscribeFooter(user)}`,
            { keyboard: generateSubscriptionsKeyboard(user) }
          );
        } else {
          user.subscribe(payload.subscription);

          await user.save();
          await respond(
            `${captions.subscribe_response(user, payload.subscription)} ${captions.subscribeOrUnsubscribeFooter(user)}`,
            { keyboard: generateSubscriptionsKeyboard(user) }
          );
        }
      } else if (
        payload.command === 'poster/subscribe'
        || payload.command === 'playlists/subscribe'
        || payload.command === 'text_materials/subscribe'
        || payload.command === 'releases/subscribe'
        || payload.command === 'drawings/subscribe'
      ) {
        const { subscription, generateKeyboard } = subscriptionMap[payload.command];

        if (payload.subscribed) {
          user.unsubscribe(subscription);

          await user.save();
          await respond(
            `${captions.unsubscribe_response(user, subscription)} ${captions.subscribeOrUnsubscribeFooter(user)}`,
            { keyboard: await generateKeyboard(user) }
          );
        } else {
          user.subscribe(subscription);

          await user.save();
          await respond(
            `${captions.subscribe_response(user, subscription)} ${captions.subscribeOrUnsubscribeFooter(user)}`,
            { keyboard: await generateKeyboard(user) }
          );
        }
      } else if (payload.command === 'soundfest') {
        await respond(captions.soundfest_response(user), { keyboard: soundfestKeyboard });
      } else if (payload.command === 'soundfest/go_to_event') {
        await respond(`${captions.soundfest_go_to_event_response}\n\n➡ ${links.soundfest_event}`);
      } else if (payload.command === 'soundfest/buy_ticket') {
        await respond(`${captions.soundfest_buy_ticket_response}\n\n➡ ${links.soundfest_buy_ticket}`);
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
          await respond(captions.admin_no_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
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
          await respond(captions.admin_no_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
        }
      } else if (payload.command === 'admin/drawings/drawing/edit_name/message') {
        const drawing = await Drawing.findByPk(payload.drawingId);

        if (drawing) {
          drawing.name = text;

          await drawing.save();
          await respond(captions.drawing_edited);
        } else {
          await respond(captions.admin_no_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
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
          await respond(captions.admin_no_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
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
          await respond(captions.admin_no_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
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
          await respond(captions.admin_no_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
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
          await respond(captions.admin_no_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
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
          await respond(captions.admin_no_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
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
          await respond(captions.admin_no_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
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
        const userIds = text.split(/[,\s]+/).filter((id) => /^\d+$/.test(id)).map((id) => +id);

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
          } else if (isNumbersArray(payload.group)) {
            await sendVKMessages(payload.group, payload.text, sendOptions);
          } else {
            await sendVkMessageToSubscribedUsers(payload.group, payload.text, sendOptions);
          }

          await respond(captions.message_successfully_sent);
        } else {
          user.state = { ...payload };

          await respond(captions.need_to_refresh_keyboard);
        }
      } else {
        Logger.warn('warning: unknown payload', payload);

        await respond(generateRandomCaption(captions.unknown_payload), { keyboard: mainKeyboard });
      }
    } else if (isNewUser) {
      await respond(captions.welcome_text(user), { keyboard: mainKeyboard });
    } else {
      await Promise.all([
        respond(captions.unknown_message_response),
        sendVKMessage(config.targets.unknownMessage, captions.unknown_message, {
          forwardMessages: [body.object.id]
        })
      ]);
    }

    user.lastMessageDate = newLastMessageDate;
    user.state = user.state === userState
      ? null
      : user.state;

    await user.save();
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
  } else if (body.type === 'wall_post_new') {
    const photoAttachment = (body.object.attachments || []).find(({ type }) => type === 'photo') as PhotoAttachment | undefined;

    if (photoAttachment) {
      const postId = `${body.object.owner_id}_${body.object.id}`;
      const hashtags = photoAttachment.photo.text
        .split(/\s+/)
        .map((hashtag) => hashtag.trim())
        .filter(Boolean);
      const hashtagFromCombination = _.find(hashtagCombinations, ([combination]) => (
        combination.every((hashtag) => hashtags.includes(hashtag))
      ));
      const hashtag = hashtagFromCombination
        ? hashtagFromCombination[1]
        : _.find(Hashtag, (hashtag) => hashtags.includes(hashtag));

      if (hashtag) {
        const subscriptionCaptions = captions.subscription_message[hashtag];
        const subscriptions = _.filter(Subscription, (subscription) => (
          subscriptionHashtags[subscription].some((hashtag) => hashtags.includes(hashtag))
        ));
        const caption = subscriptionCaptions[Math.floor(Math.random() * subscriptionCaptions.length)];
        const messageOptions: SendVkMessageOptions = {
          attachments: [{ type: 'wall', id: postId }],
          randomId: 2n ** 30n + BigInt(body.object.id),
        };

        if (typeof caption === 'string') {
          await sendVkMessageToSubscribedUsers(subscriptions, caption, messageOptions);

          break eventHandler;
        }

        const subscribedUsers = (await User.findAll()).filter((user) => (
          user.subscriptions.some((subscription) => subscriptions.includes(subscription))
        ));
        const messageGroups = _.groupBy(subscribedUsers, (user) => (caption as Exclude<typeof caption, string>)({ user }));

        for (const message in messageGroups) {
          if (messageGroups.hasOwnProperty(message)) {
            const vkIds = messageGroups[message].map(({ vkId }) => vkId);

            await sendVKMessages(vkIds, message, messageOptions);
          }
        }
      }
    }
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
  }

  ctx.body = 'ok';
}
