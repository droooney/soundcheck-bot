import * as _ from 'lodash';
import moment = require('moment-timezone');
import { Context } from 'koa';

import {
  SendVkMessageOptions,

  getHolidays,
  getConcerts,
  getConcertsByDays,
  getConcertsByDaysStrings,
  getConcertsString,
  getDailyConcerts,
  getDayString,
  getPostId,
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
  User,
  UserState,
} from './types';
import {
  genreNames,
  genreMatches,
  subscriptionNames,
  subscriptionHashtags,
  confirmPositiveAnswers,
} from './constants';
import {
  generateButton,
  generateBackButton,
  generateMainKeyboard,
  generatePosterKeyboard,
  generateWeekPosterKeyboard,
  generateDrawingsKeyboard,
  generateSubscriptionsKeyboard,
  generateAdminDrawingsKeyboard,
  generateAdminDrawingMenuKeyboard,

  genresKeyboard,
  servicesKeyboard,
  textMaterialsKeyboard,
  audioMaterialsKeyboard,
  writeToSoundcheckKeyboard,
  adminKeyboard,
  adminStatsKeyboard,
} from './keyboards';
import Database from './Database';
import captions from './captions';
import config from './config';

export default async (ctx: Context) => {
  const body: Body = ctx.request.body;
  const dailyStats = Database.getTodayDailyStats();
  const requestTime = moment();
  const latestClickTime = +requestTime.clone().subtract(1, 'minute');

  console.log('bot event', requestTime.format('YYYY-MM-DD HH:mm:ss.SSS'), body);

  eventHandler: if (body.type === 'confirmation') {
    ctx.body = 'afcb8751';
  } else if (body.type === 'message_new') {
    const userId = body.object.peer_id;
    const isManager = Database.managers.includes(userId);
    const mainKeyboard = generateMainKeyboard(isManager);
    const respond = async (message: string, options: SendVkMessageOptions = {}) => {
      await sendVKMessage(userId, message, options);
    };
    const user = Database.getUserById(userId);
    const userState = user.state;
    const newLastMessageDate = body.object.date * 1000;
    let newUserState: UserState = null;
    let payload: ButtonPayload | null = null;

    if (body.object.payload) {
      try {
        payload = JSON.parse(body.object.payload);
      } catch (err) {}
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

      if (
        !isManager && !dailyStats.clicks.some((click) => (
          click.userId === userId
          && click.date >= latestClickTime
          && _.isEqual(click.payload, payload)
        ))
      ) {
        dailyStats.clicks.push({
          userId,
          date: +requestTime,
          payload
        });
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
      } else if (payload.command === 'poster/subscribe') {
        if (payload.subscribed) {
          await Database.unsubscribeUser(user, Subscription.POSTER);

          await respond(captions.unsubscribe_response(Subscription.POSTER), { keyboard: generatePosterKeyboard(user) });
        } else {
          await Database.subscribeUser(user, Subscription.POSTER);

          await respond(captions.subscribe_response(Subscription.POSTER), { keyboard: generatePosterKeyboard(user) });
        }
      } else if (payload.command === 'playlist') {
        await respond(captions.playlists_response);
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
        newUserState = {
          type: 'write_to_soundcheck/tell_about_group'
        };

        await respond(captions.tell_about_group_response);
      } else if (payload.command === 'write_to_soundcheck/tell_about_release') {
        newUserState = {
          type: 'write_to_soundcheck/tell_about_release'
        };

        await respond(captions.tell_about_release_response);
      } else if (payload.command === 'write_to_soundcheck/collaboration') {
        newUserState = {
          type: 'write_to_soundcheck/collaboration'
        };

        await respond(captions.collaboration_response);
      } else if (payload.command === 'write_to_soundcheck/tell_about_bug') {
        newUserState = {
          type: 'write_to_soundcheck/tell_about_bug'
        };

        await respond(captions.tell_about_bug_response);
      } else if (payload.command === 'write_to_soundcheck/want_to_participate') {
        newUserState = {
          type: 'write_to_soundcheck/want_to_participate'
        };

        await respond(captions.want_to_participate_response);
      } else if (payload.command === 'write_to_soundcheck/other') {
        newUserState = {
          type: 'write_to_soundcheck/other'
        };

        await respond(captions.write_to_soundcheck_other_response);
      } else if (payload.command === 'services') {
        await respond(captions.choose_service, { keyboard: servicesKeyboard });
      } else if (payload.command === 'services/service') {
        if (payload.service.type === 'market') {
          await respond('', {
            attachments: [payload.service.id]
          });
        }
      } else if (payload.command === 'subscriptions') {
        await respond(captions.subscriptions_response(user), { keyboard: generateSubscriptionsKeyboard(user) });
      } else if (payload.command === 'subscriptions/subscription') {
        if (payload.subscribed) {
          await Database.unsubscribeUser(user, payload.subscription);

          await respond(captions.unsubscribe_response(payload.subscription), { keyboard: generateSubscriptionsKeyboard(user) });
        } else {
          await Database.subscribeUser(user, payload.subscription);

          await respond(captions.subscribe_response(payload.subscription), { keyboard: generateSubscriptionsKeyboard(user) });
        }
      } else if (payload.command === 'admin' || (payload.command === 'back' && payload.dest === BackButtonDest.ADMIN)) {
        await respond(captions.choose_action, { keyboard: adminKeyboard });
      } else if (payload.command === 'admin/drawings' || (payload.command === 'back' && payload.dest === BackButtonDest.ADMIN_DRAWINGS)) {
        await respond(captions.choose_or_add_drawing, { keyboard: generateAdminDrawingsKeyboard() });
      } else if (payload.command === 'admin/drawings/add') {
        newUserState = {
          type: 'admin/drawings/add/set_name'
        };

        await respond(captions.enter_drawing_name);
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
          newUserState = {
            type: 'admin/drawings/drawing/edit_name',
            drawingId: payload.drawingId
          };

          await respond(captions.enter_drawing_name);
        } else {
          await respond(captions.no_drawing, { keyboard: generateAdminDrawingsKeyboard() });
        }
      } else if (payload.command === 'admin/drawings/drawing/edit_post') {
        const drawing = Database.getDrawingById(payload.drawingId);

        if (drawing) {
          newUserState = {
            type: 'admin/drawings/drawing/edit_post',
            drawingId: payload.drawingId
          };

          await respond(captions.send_drawing_post);
        } else {
          await respond(captions.no_drawing, { keyboard: generateAdminDrawingsKeyboard() });
        }
      } else if (payload.command === 'admin/drawings/drawing/delete') {
        const drawing = Database.getDrawingById(payload.drawingId);

        if (drawing) {
          newUserState = {
            type: 'admin/drawings/drawing/delete',
            drawingId: payload.drawingId
          };

          await respond(captions.confirm_drawing_delete(drawing));
        } else {
          await respond(captions.no_drawing, { keyboard: generateAdminDrawingsKeyboard() });
        }
      } else if (payload.command === 'admin/stats') {
        await respond(captions.stats_response, { keyboard: adminStatsKeyboard });
      } else if (payload.command === 'admin/stats/subscriptions') {
        const subscriptions = _.mapValues(Subscription, (subscription) => (
          _.filter(Database.users, (user) => !!user && user.subscriptions.includes(subscription)).length
        ));

        await respond(
          _.map(subscriptions, (count, subscription: Subscription) => `${subscriptionNames[subscription]}: ${count}`).join('\n')
        );
      } else if (payload.command === 'refresh_keyboard') {
        await respond(captions.refresh_keyboard_response, { keyboard: mainKeyboard });
      }
    } else if (userState) {
      const text = body.object.text;

      if (userState.type.startsWith('admin') && !isManager) {
        await respond(captions.you_re_not_a_manager, { keyboard: mainKeyboard });

        break message;
      }

      if (userState.type === 'write_to_soundcheck/tell_about_group') {
        await Promise.all([
          respond(captions.tell_about_group_message_response),
          sendVKMessage(config.targets.tellAboutGroup, captions.group_history_message, {
            forwardMessages: [body.object.id]
          })
        ]);
      } else if (userState.type === 'write_to_soundcheck/tell_about_release') {
        await Promise.all([
          respond(captions.tell_about_release_message_response),
          sendVKMessage(config.targets.tellAboutRelease, captions.release_message, {
            forwardMessages: [body.object.id]
          })
        ]);
      } else if (userState.type === 'write_to_soundcheck/collaboration') {
        await Promise.all([
          respond(captions.collaboration_message_response),
          sendVKMessage(config.targets.collaboration, captions.collaboration_message, {
            forwardMessages: [body.object.id]
          })
        ]);
      } else if (userState.type === 'write_to_soundcheck/tell_about_bug') {
        await Promise.all([
          respond(captions.tell_about_bug_message_response),
          sendVKMessage(config.targets.tellAboutBug, captions.tell_about_bug_message, {
            forwardMessages: [body.object.id]
          })
        ]);
      } else if (userState.type === 'write_to_soundcheck/want_to_participate') {
        await Promise.all([
          respond(captions.want_to_participate_message_response),
          sendVKMessage(config.targets.wantToParticipate, captions.want_to_participate_message, {
            forwardMessages: [body.object.id]
          })
        ]);
      } else if (userState.type === 'write_to_soundcheck/other') {
        await Promise.all([
          respond(captions.write_to_soundcheck_other_message_response),
          sendVKMessage(config.targets.other, captions.write_to_soundcheck_other_message, {
            forwardMessages: [body.object.id]
          })
        ]);
      } else if (userState.type === 'admin/drawings/add/set_name') {
        newUserState = {
          type: 'admin/drawings/add/set_post',
          name: text
        };

        await respond(captions.send_drawing_post);
      } else if (userState.type === 'admin/drawings/add/set_post') {
        const postId = getPostId(body.object);

        if (postId) {
          await Database.addDrawing({
            name: userState.name,
            postId
          });

          await respond(captions.drawing_added, { keyboard: generateAdminDrawingsKeyboard() });
        } else {
          newUserState = userState;

          await respond(captions.send_drawing_post);
        }
      } else if (userState.type === 'admin/drawings/drawing/edit_name') {
        const drawing = Database.getDrawingById(userState.drawingId);

        if (drawing) {
          await Database.editDrawing(drawing, 'name', text);

          await respond(captions.drawing_edited, { keyboard: generateAdminDrawingMenuKeyboard(drawing) });
        } else {
          await respond(captions.no_drawing, { keyboard: generateAdminDrawingsKeyboard() });
        }
      } else if (userState.type === 'admin/drawings/drawing/edit_post') {
        const drawing = Database.getDrawingById(userState.drawingId);

        if (drawing) {
          const postId = getPostId(body.object);

          if (postId) {
            await Database.editDrawing(drawing, 'postId', postId);

            await respond(captions.drawing_edited, { keyboard: generateAdminDrawingMenuKeyboard(drawing) });
          } else {
            newUserState = userState;

            await respond(captions.send_drawing_post);
          }
        } else {
          await respond(captions.no_drawing, { keyboard: generateAdminDrawingsKeyboard() });
        }
      } else if (userState.type === 'admin/drawings/drawing/delete') {
        if (confirmPositiveAnswers.includes(text.toLowerCase())) {
          await Database.deleteDrawing(userState.drawingId);

          await respond(captions.drawing_deleted, { keyboard: generateAdminDrawingsKeyboard() });
        } else {
          const drawing = Database.getDrawingById(userState.drawingId);

          if (drawing) {
            await respond(captions.choose_action, { keyboard: generateAdminDrawingMenuKeyboard(drawing) });
          } else {
            await respond(captions.no_drawing, { keyboard: generateAdminDrawingsKeyboard() });
          }
        }
      }
    }

    await Database.editUser(user, {
      lastMessageDate: newLastMessageDate,
      state: newUserState
    });

    ctx.body = 'ok';
  } else if (body.type === 'group_officers_edit') {
    const {
      user_id,
      level_new
    } = body.object;

    Database.managers = Database.managers.filter((id) => id !== user_id);

    if (level_new > 1) {
      Database.managers.push(user_id);
    }

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
      const subscriptionPost = Database.getSubscriptionPostById(postId);
      const hashtags = photoAttachment.photo.text
        .split(/\s+/)
        .map((hashtag) => hashtag.trim())
        .filter(Boolean);
      const subscriptions = _.filter(Subscription, (subscription) => (
        subscriptionHashtags[subscription].some((hashtag) => hashtags.includes(hashtag))
      ));
      const subscribedUsers = _.chunk(
        _.filter(Database.users, (user) => (
          !!user
          && user.subscriptions.some((subscription) => subscriptions.includes(subscription))
          && !subscriptionPost.sent.includes(user.id)
        )) as User[],
        100
      );

      for (const users of subscribedUsers) {
        const userIds = users.map(({ id }) => id);

        await sendVKMessage(userIds, '', {
          attachments: [`wall${postId}`]
        });

        await Database.addSentSubscriptions(subscriptionPost, userIds);
      }

      await Database.deleteSubscriptionFile(postId);
    }

    ctx.body = 'ok';
  } else if (body.type === 'wall_repost') {
    console.log('123', body.object.copy_history);

    if (body.object.copy_history && body.object.copy_history[0]) {
      console.log('456', body.object.copy_history[0].copy_history);
    }

    ctx.body = 'ok';
  } else {
    ctx.body = 'ok';
  }

  Database.saveDailyStats(dailyStats);
}
