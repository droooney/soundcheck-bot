import * as _ from 'lodash';
import moment = require('moment-timezone');
import { Context } from 'koa';

import {
  SendVkMessageOptions,

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
  getWeeklyConcerts,
  sendVKMessage,
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
  confirmPositiveAnswers,
  serviceResponses,
} from './constants';
import {
  generateButton,
  generateBackButton,
  generateMainKeyboard,
  generatePosterKeyboard,
  generateWeekPosterKeyboard,
  generatePlaylistsKeyboard,
  generateDrawingsKeyboard,
  generateSubscriptionsKeyboard,
  generateAdminDrawingsKeyboard,
  generateAdminDrawingMenuKeyboard,

  subscriptionMap,
  genresKeyboard,
  servicesKeyboard,
  textMaterialsKeyboard,
  audioMaterialsKeyboard,
  writeToSoundcheckKeyboard,
  adminKeyboard,
  adminStatsKeyboard,
  adminClickStatsKeyboard,
  adminGroupStatsKeyboard,
  adminRepostStatsKeyboard,
} from './keyboards';
import Database from './Database';
import config from './config';
import User from './database/User';

export default async (ctx: Context) => {
  const body: Body = ctx.request.body;
  const dailyStats = Database.getTodayDailyStats();
  const requestTime = moment();
  const latestClickTime = +requestTime.clone().subtract(1, 'minute');

  console.log('bot event', requestTime.format('YYYY-MM-DD HH:mm:ss.SSS'), body);

  eventHandler: if (body.type === 'confirmation') {
    ctx.body = 'afcb8751';
  } else if (body.type === 'message_new') {
    const messageId = body.object.id;
    const vkId = body.object.peer_id;
    const text = body.object.text;
    const isManager = ctx.managers.includes(vkId);
    const mainKeyboard = generateMainKeyboard(isManager);
    const respond = async (message: string, options: SendVkMessageOptions = {}) => {
      await sendVKMessage(vkId, message, options);
    };
    const [user] = await User.findOrCreate({
      where: { vkId },
      defaults: { vkId }
    });
    const localUser = Database.getUserById(vkId);
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
      && buttonPayload.command !== 'refresh_keyboard'
      && !dailyStats.clicks.some((click) => (
        click.userId === vkId
        && click.date >= latestClickTime
        && _.isEqual(click.payload, payload)
      ))
    ) {
      dailyStats.clicks.push({
        userId: vkId,
        date: +requestTime,
        payload: buttonPayload
      });
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
        await respond(captions.you_re_not_a_manager, { keyboard: mainKeyboard, randomId: body.object.conversation_message_id });

        break message;
      }

      if (payload.command === 'start') {
        await respond(captions.welcome_text, { keyboard: mainKeyboard });
      } else if (payload.command === 'back' && payload.dest === BackButtonDest.MAIN) {
        await respond(captions.choose_action, { keyboard: mainKeyboard });
      } else if (payload.command === 'poster' || (payload.command === 'back' && payload.dest === BackButtonDest.POSTER)) {
        await respond(captions.choose_poster_type, { keyboard: generatePosterKeyboard(user) });
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

          await respond(captions.choose_day, {
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
        const concerts = await getDailyConcerts(moment(payload.dayStart));

        await respond(
          concerts.length
            ? getConcertsString(concerts)
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
        const drawingsKeyboard = generateDrawingsKeyboard();

        if (drawingsKeyboard) {
          await respond(captions.choose_drawing, { keyboard: drawingsKeyboard });
        } else {
          await respond(captions.no_drawings);
        }
      } else if (payload.command === 'drawings/drawing') {
        const drawingId = payload.drawingId;
        const drawing = Database.drawings.find(({ id }) => id === drawingId);

        if (drawing) {
          await respond(drawing.name, {
            attachments: [`wall${drawing.postId}`]
          });
        } else {
          const drawingsKeyboard = generateDrawingsKeyboard();

          if (drawingsKeyboard) {
            await respond(captions.no_drawing, { keyboard: drawingsKeyboard });
          } else {
            await respond(captions.no_drawings, { keyboard: mainKeyboard });
          }
        }
      } else if (payload.command === 'text_materials') {
        await respond(captions.text_materials_response, { keyboard: textMaterialsKeyboard });
      } else if (payload.command === 'text_materials/longread') {
        await respond(captions.longreads_response);
      } else if (payload.command === 'text_materials/group_history') {
        await respond(captions.group_history_response);
      } else if (payload.command === 'audio_materials') {
        await respond(captions.audio_materials_response, { keyboard: audioMaterialsKeyboard });
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
        const { message, attachments } = serviceResponses[payload.service];

        await respond(message, { attachments });
      } else if (payload.command === 'subscriptions') {
        await respond(captions.subscriptions_response(localUser), { keyboard: generateSubscriptionsKeyboard(user) });
      } else if (payload.command === 'subscriptions/subscription') {
        if (payload.subscribed) {
          user.subscribe(payload.subscription);

          await respond(captions.unsubscribe_response(payload.subscription), { keyboard: generateSubscriptionsKeyboard(user) });
        } else {
          user.unsubscribe(payload.subscription);

          await respond(captions.subscribe_response(payload.subscription), { keyboard: generateSubscriptionsKeyboard(user) });
        }
      } else if (
        payload.command === 'poster/subscribe'
        || payload.command === 'playlists/subscribe'
      ) {
        const { subscription, generateKeyboard } = subscriptionMap[payload.command];

        if (payload.subscribed) {
          user.subscribe(subscription);

          await respond(captions.unsubscribe_response(subscription), { keyboard: generateKeyboard(user) });
        } else {
          user.unsubscribe(subscription);

          await respond(captions.subscribe_response(subscription), { keyboard: generateKeyboard(user) });
        }
      } else if (payload.command === 'admin' || (payload.command === 'back' && payload.dest === BackButtonDest.ADMIN)) {
        await respond(captions.choose_action, { keyboard: adminKeyboard });
      } else if (payload.command === 'admin/drawings' || (payload.command === 'back' && payload.dest === BackButtonDest.ADMIN_DRAWINGS)) {
        await respond(captions.choose_or_add_drawing, { keyboard: generateAdminDrawingsKeyboard() });
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
          await Database.addDrawing({
            name: payload.name,
            postId
          });

          await respond(captions.drawing_added, { keyboard: generateAdminDrawingsKeyboard() });
        } else {
          user.state = { ...payload };

          await respond(captions.send_drawing_post);
        }
      } else if (payload.command === 'admin/drawings/drawing') {
        const drawing = Database.getDrawingById(payload.drawingId);

        if (drawing) {
          await respond(drawing.name, {
            attachments: [`wall${drawing.postId}`],
            keyboard: generateAdminDrawingMenuKeyboard(drawing)
          });
        } else {
          await respond(captions.no_drawing, { keyboard: generateAdminDrawingsKeyboard() });
        }
      } else if (payload.command === 'admin/drawings/drawing/edit_name') {
        const drawing = Database.getDrawingById(payload.drawingId);

        if (drawing) {
          user.state = {
            command: 'admin/drawings/drawing/edit_name/message',
            drawingId: payload.drawingId
          };

          await respond(captions.enter_drawing_name);
        } else {
          await respond(captions.no_drawing, { keyboard: generateAdminDrawingsKeyboard() });
        }
      } else if (payload.command === 'admin/drawings/drawing/edit_name/message') {
        const drawing = Database.getDrawingById(payload.drawingId);

        if (drawing) {
          await Database.editDrawing(drawing, 'name', text);

          await respond(captions.drawing_edited, { keyboard: generateAdminDrawingMenuKeyboard(drawing) });
        } else {
          await respond(captions.no_drawing, { keyboard: generateAdminDrawingsKeyboard() });
        }
      } else if (payload.command === 'admin/drawings/drawing/edit_post') {
        const drawing = Database.getDrawingById(payload.drawingId);

        if (drawing) {
          user.state = {
            command: 'admin/drawings/drawing/edit_post/message',
            drawingId: payload.drawingId
          };

          await respond(captions.send_drawing_post);
        } else {
          await respond(captions.no_drawing, { keyboard: generateAdminDrawingsKeyboard() });
        }
      } else if (payload.command === 'admin/drawings/drawing/edit_post/message') {
        const drawing = Database.getDrawingById(payload.drawingId);

        if (drawing) {
          const postId = getPostId(body.object);

          if (postId) {
            await Database.editDrawing(drawing, 'postId', postId);

            await respond(captions.drawing_edited, { keyboard: generateAdminDrawingMenuKeyboard(drawing) });
          } else {
            user.state = { ...payload };

            await respond(captions.send_drawing_post);
          }
        } else {
          await respond(captions.no_drawing, { keyboard: generateAdminDrawingsKeyboard() });
        }
      } else if (payload.command === 'admin/drawings/drawing/delete') {
        const drawing = Database.getDrawingById(payload.drawingId);

        if (drawing) {
          user.state = {
            command: 'admin/drawings/drawing/delete/confirmation',
            drawingId: payload.drawingId
          };

          await respond(captions.confirm_drawing_delete(drawing));
        } else {
          await respond(captions.no_drawing, { keyboard: generateAdminDrawingsKeyboard() });
        }
      } else if (payload.command === 'admin/drawings/drawing/delete/confirmation') {
        if (confirmPositiveAnswers.includes(text.toLowerCase())) {
          await Database.deleteDrawing(payload.drawingId);

          await respond(captions.drawing_deleted, { keyboard: generateAdminDrawingsKeyboard() });
        } else {
          const drawing = Database.getDrawingById(payload.drawingId);

          if (drawing) {
            await respond(captions.choose_action, { keyboard: generateAdminDrawingMenuKeyboard(drawing) });
          } else {
            await respond(captions.no_drawing, { keyboard: generateAdminDrawingsKeyboard() });
          }
        }
      } else if (payload.command === 'admin/stats' || (payload.command === 'back' && payload.dest === BackButtonDest.ADMIN_STATS)) {
        await respond(captions.stats_response, { keyboard: adminStatsKeyboard });
      } else if (payload.command === 'admin/stats/subscriptions') {
        await respond(await getSubscriptionStats());
      } else if (payload.command === 'admin/stats/clicks') {
        await respond(captions.choose_period, { keyboard: adminClickStatsKeyboard });
      } else if (payload.command === 'admin/stats/clicks/period') {
        await respond(getClickStats(payload.period));
      } else if (payload.command === 'admin/stats/group') {
        await respond(captions.choose_period, { keyboard: adminGroupStatsKeyboard });
      } else if (payload.command === 'admin/stats/group/period') {
        await respond(getGroupStats(payload.period));
      } else if (payload.command === 'admin/stats/reposts') {
        await respond(captions.choose_period, { keyboard: adminRepostStatsKeyboard });
      } else if (payload.command === 'admin/stats/reposts/period') {
        await respond(getRepostStats(payload.period));
      } else if (payload.command === 'refresh_keyboard') {
        await respond(captions.refresh_keyboard_response, { keyboard: mainKeyboard });
      } else {
        console.error('unknown payload', payload);

        await respond(captions.choose_action, { keyboard: mainKeyboard });
      }
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
  } else if (body.type === 'group_leave') {
    const userId = body.object.user_id;
    const joinedIndex = dailyStats.groupJoinUsers.findIndex((joined) => joined === userId);

    if (joinedIndex === -1) {
      if (dailyStats.groupLeaveUsers.every((left) => left.userId !== userId)) {
        dailyStats.groupLeaveUsers.push({
          userId,
          self: !!body.object.self
        });
      }
    } else {
      dailyStats.groupJoinUsers.splice(joinedIndex, 1);
    }

    // todo: send message

    ctx.body = 'ok';
  } else if (body.type === 'group_join') {
    if (body.object.join_type === 'join' || body.object.join_type === 'accepted') {
      const userId = body.object.user_id;
      const leftIndex = dailyStats.groupLeaveUsers.findIndex((left) => left.userId === userId);

      if (leftIndex === -1) {
        if (dailyStats.groupJoinUsers.every((joined) => joined !== userId)) {
          dailyStats.groupJoinUsers.push(userId);
        }
      } else {
        dailyStats.groupLeaveUsers.splice(leftIndex, 1);
      }
    }

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
      const subscribedUsers = _.chunk(
        (await User.findAll()).filter((user) => (
          !!user
          && user.subscriptions.some((subscription) => subscriptions.includes(subscription))
        )),
        100
      );

      for (const users of subscribedUsers) {
        const userIds = users.map(({ vkId }) => vkId);

        await sendVKMessage(userIds, '', {
          attachments: [`wall${postId}`],
          randomId: 2n ** 63n + BigInt(body.object.id),
        });
      }
    }

    ctx.body = 'ok';
  } else if (body.type === 'wall_repost') {
    const userId = body.object.owner_id;
    const postId = getRepostPostId(body.object);

    if (postId && dailyStats.reposts.every((repost) => repost.userId !== userId || repost.postId !== postId)) {
      dailyStats.reposts.push({
        userId,
        postId: `${userId}_${body.object.id}`,
        originalPostId: postId
      });
    }

    ctx.body = 'ok';
  } else {
    ctx.body = 'ok';
  }

  (async () => {
    try {
      await Database.saveDailyStats(dailyStats);
    } catch (err) {
      console.log('failed to save daily stats', err);
    }
  })();
}
