import * as _ from 'lodash';
import moment = require('moment-timezone');

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
  getRepostStats,
  getSubscriptionStats,
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
  ButtonPayload,
  ClientInfo,
  Genre,
  Keyboard,
  Message,
  PhotoAttachment,
  PlaylistGenre,
  SubscribeToSectionButtonPayload,
  Subscription,
  UserState,
} from './types';
import {
  captions,
  links,
  negativeAnswers,
  playlistsGenreNames,
  positiveAnswers,
  services,
} from './constants';
import {
  generateMainKeyboard,
  generatePosterKeyboard,
  generateWeekPosterKeyboard,
  generateDayPosterKeyboard,
  generateGenrePosterKeyboard,
  generatePlaylistsKeyboard,
  generatePlaylistsGenresKeyboard,
  generateTextMaterialsKeyboard,
  generateReleasesKeyboard,
  generateDrawingsKeyboard,
  generateSubscriptionsKeyboard,
  generateServicesKeyboard,
  generateSoundfestKeyboard,
  generateAdminDrawingsKeyboard,
  generateAdminDrawingMenuKeyboard,

  subscriptionMap,
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
import User from './database/User';
import Drawing from './database/Drawing';
import KeyValuePair from './database/KeyValuePair';
import Logger from './Logger';

export interface ActionOptions<T> {
  respond(message: string, options?: SendVkMessageOptions): void;
  payload: T;
  user: User;
  message: Message;
  clientInfo: ClientInfo;
  mainKeyboard: Keyboard;
}

export type ActionCallback<T extends Action> = (options: ActionOptions<T>) => void;

export type Action = ButtonPayload | Exclude<UserState, null>;

export type CommandAction<T extends Action['command']> = Extract<Action, { command: T; }>;

const actionMap: { [command in Action['command']]: ActionCallback<CommandAction<command>>; } = {
  async start({ respond, user, mainKeyboard }) {
    await respond(captions.welcome_text(user), { keyboard: mainKeyboard });
  },
  async back({ respond, payload, user, clientInfo, mainKeyboard }) {
    if (payload.dest === BackButtonDest.MAIN) {
      const buttonsCount = mainKeyboard.buttons.reduce((count, buttons) => count + buttons.length, 0);

      await respond(generateRandomCaption(captions.back_to_main_menu, { user, buttonsCount }), { keyboard: mainKeyboard });
    } else if (payload.dest === BackButtonDest.POSTER) {
      await respond(generateRandomCaption(captions.back_to_poster, { user }), { keyboard: generatePosterKeyboard(user) });
    } else if (payload.dest === BackButtonDest.PLAYLISTS) {
      await respond(
        generateRandomCaption(captions.back_to_playlists, { user }),
        { keyboard: generatePlaylistsKeyboard(user, clientInfo) }
      );
    } else if (payload.dest === BackButtonDest.ADMIN) {
      await respond(captions.choose_action, { keyboard: adminKeyboard });
    } else if (payload.dest === BackButtonDest.ADMIN_DRAWINGS) {
      await respond(captions.choose_or_add_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
    } else if (payload.dest === BackButtonDest.ADMIN_STATS) {
      await respond(captions.stats_response, { keyboard: adminStatsKeyboard });
    }
  },

  async poster({ respond, user }) {
    await respond(generateRandomCaption(captions.choose_poster_type, { user }), { keyboard: generatePosterKeyboard(user) });
  },
  async 'poster/type'({ respond, payload }) {
    if (payload.type === 'day') {
      const upcomingConcerts = await getConcerts(moment().startOf('day'));

      if (!upcomingConcerts.length) {
        await respond(captions.no_concerts_by_day);

        return;
      }

      const concertsByDays = getConcertsByDays(upcomingConcerts);

      await respond(generateRandomCaption(captions.choose_day), { keyboard: await generateDayPosterKeyboard(concertsByDays) });
    } else if (payload.type === 'week') {
      await respond(generateRandomCaption(captions.choose_week), { keyboard: generateWeekPosterKeyboard() });
    } else if (payload.type === 'genres') {
      const allConcerts = await getConcerts(moment().startOf('day'));

      await respond(generateRandomCaption(captions.choose_genre), { keyboard: generateGenrePosterKeyboard(allConcerts) });
    }
  },
  async 'poster/type/day'({ respond, payload, user }) {
    const date = moment(payload.dayStart);
    const concerts = await getDailyConcerts(date);

    if (!concerts.length) {
      await respond(captions.no_concerts_at_day);

      return;
    }

    const dateString = getDayString(date);
    const concertsString = getConcertsString(concerts);
    const caption = concerts.length > 1
      ? generateRandomCaption(captions.concerts_at_day, { user, dateString, concertsCount: concerts.length })
      : generateRandomCaption(captions.concert_at_day, { dateString });

    await respond(`${caption}\n\n${concertsString}`);
  },
  async 'poster/type/week'({ respond, payload, user }) {
    const today = +moment().startOf('day');
    const weekStart = moment(payload.weekStart);
    const concerts = (await getWeeklyConcerts(weekStart)).filter(({ startTime }) => +startTime >= today);

    if (!concerts.length) {
      await respond(captions.no_concerts_at_week);

      return;
    }

    const weekString = getWeekString(weekStart);
    const groups = getConcertsByDays(concerts);
    const concertsStrings = getConcertsByDaysStrings(
      groups,
      concerts.length === 1
        ? captions.concert_at_week(weekString)
        : generateRandomCaption(captions.concerts_at_week, { user, weekString, concertsCount: concerts.length })
    );

    for (const concertsString of concertsStrings) {
      await respond(concertsString);
    }
  },
  async 'poster/type/genre'({ respond, payload, user }) {
    const genre = payload.genre;
    const allConcerts = await getConcerts(moment().startOf('day'));
    const genreConcerts = allConcerts.filter((concert) => isConcertInGenre(concert, genre));

    if (!genreConcerts.length) {
      await respond(captions.no_concerts_in_genre(genre));

      return;
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
  },

  async playlists({ respond, user, clientInfo }) {
    await respond(
      generateRandomCaption(captions.playlists_response, { user }),
      { keyboard: generatePlaylistsKeyboard(user, clientInfo) }
    );
  },
  async 'playlists/all'({ respond }) {
    await respond(`${generateRandomCaption(captions.playlists_all_response)}\n\n➡ ${links.playlists_all}`);
  },
  async 'playlists/thematic'({ respond }) {
    await respond(`${generateRandomCaption(captions.playlists_thematic_response)}\n\n➡ ${links.playlists_thematic}`);
  },
  async 'playlists/genre'({ respond, clientInfo }) {
    const playlists = _.map(PlaylistGenre, (genre) => ({ name: playlistsGenreNames[genre] }));

    await respond(
      generateRandomCaption(captions.playlists_genres_response, { playlists }),
      { keyboard: generatePlaylistsGenresKeyboard(clientInfo) }
    );
  },
  async 'playlists/genre/type'({ respond, payload, user }) {
    const playlist = {
      name: playlistsGenreNames[payload.genre],
      link: links.playlists_genre[payload.genre]
    };

    await respond(`${generateRandomCaption(captions.playlists_genre_response, { user, playlist })}\n\n➡ ${playlist.link}`);
  },

  async releases({ respond, user, clientInfo }) {
    await respond(
      generateRandomCaption(captions.releases_response, { user }),
      { keyboard: await generateReleasesKeyboard(user, clientInfo) }
    );
  },
  async 'releases/week_releases'({ respond, user }) {
    const latestReleasesLink = await KeyValuePair.findOrAdd('latest_releases_link');

    await respond(`${generateRandomCaption(captions.week_releases_response, { user })}\n\n➡ ${latestReleasesLink.value}`);
  },
  async 'releases/digests'({ respond }) {
    const latestDigestLink = await KeyValuePair.findOrAdd('latest_releases_link');

    await respond(`${generateRandomCaption(captions.digests_response)}\n\n➡ ${latestDigestLink.value}`);
  },

  async drawings({ respond, user, clientInfo }) {
    const keyboard = await generateDrawingsKeyboard(user, clientInfo);
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
  },
  async 'drawings/drawing'({ respond, payload, user, clientInfo }) {
    const drawing = await Drawing.findByPk(payload.drawingId);

    if (drawing) {
      await respond(generateRandomCaption(captions.drawing_response, { drawing }), {
        attachments: [{ type: 'wall', id: drawing.postId }]
      });
    } else {
      const [keyboard, drawings] = await Promise.all([
        generateDrawingsKeyboard(user, clientInfo),
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
  },

  async text_materials({ respond, user, clientInfo }) {
    await respond(
      generateRandomCaption(captions.text_materials_response, { user }),
      { keyboard: generateTextMaterialsKeyboard(user, clientInfo) }
    );
  },
  async 'text_materials/longread'({ respond, user }) {
    await respond(`${generateRandomCaption(captions.longreads_response, { user })}\n\n➡ ${links.longreads}`);
  },
  async 'text_materials/group_history'({ respond, user }) {
    await respond(`${generateRandomCaption(captions.group_history_response, { user })}\n\n➡ ${links.group_history}`);
  },

  async write_to_soundcheck({ respond, user }) {
    await respond(generateRandomCaption(captions.write_to_soundcheck_response, { user }), { keyboard: writeToSoundcheckKeyboard });
  },
  async 'write_to_soundcheck/tell_about_group'({ respond, user }) {
    user.state = {
      command: 'write_to_soundcheck/tell_about_group/message'
    };

    await respond(captions.tell_about_group_response);
  },
  async 'write_to_soundcheck/tell_about_group/message'({ respond, user, message }) {
    await Promise.all([
      respond(captions.tell_about_group_message_response(user)),
      sendVKMessage(config.targets.tellAboutGroup, captions.group_history_message, {
        forwardMessages: [message.id]
      })
    ]);
  },
  async 'write_to_soundcheck/tell_about_release'({ respond, user }) {
    user.state = {
      command: 'write_to_soundcheck/tell_about_release/message'
    };

    await respond(captions.tell_about_release_response);
  },
  async 'write_to_soundcheck/tell_about_release/message'({ respond, user, message }) {
    await Promise.all([
      respond(captions.tell_about_release_message_response(user)),
      sendVKMessage(config.targets.tellAboutRelease, captions.release_message, {
        forwardMessages: [message.id]
      })
    ]);
  },
  async 'write_to_soundcheck/tell_about_bug'({ respond, user }) {
    user.state = {
      command: 'write_to_soundcheck/tell_about_bug/message'
    };

    await respond(captions.tell_about_bug_response);
  },
  async 'write_to_soundcheck/tell_about_bug/message'({ respond, user, message }) {
    await Promise.all([
      respond(captions.tell_about_bug_message_response(user)),
      sendVKMessage(config.targets.tellAboutBug, captions.tell_about_bug_message, {
        forwardMessages: [message.id]
      })
    ]);
  },
  async 'write_to_soundcheck/want_to_participate'({ respond, user }) {
    user.state = {
      command: 'write_to_soundcheck/want_to_participate/message'
    };

    await respond(captions.want_to_participate_response);
  },
  async 'write_to_soundcheck/want_to_participate/message'({ respond, user, message }) {
    await Promise.all([
      respond(captions.want_to_participate_message_response(user)),
      sendVKMessage(config.targets.wantToParticipate, captions.want_to_participate_message, {
        forwardMessages: [message.id]
      })
    ]);
  },
  async 'write_to_soundcheck/other'({ respond, user }) {
    user.state = {
      command: 'write_to_soundcheck/other/message'
    };

    await respond(captions.write_to_soundcheck_other_response);
  },
  async 'write_to_soundcheck/other/message'({ respond, user, message }) {
    await Promise.all([
      respond(captions.write_to_soundcheck_other_message_response(user)),
      sendVKMessage(config.targets.other, captions.write_to_soundcheck_other_message, {
        forwardMessages: [message.id]
      })
    ]);
  },

  async services({ respond, user, clientInfo }) {
    await respond(captions.services_response(user), { keyboard: generateServicesKeyboard(clientInfo) });
  },
  async 'services/service'({ respond, payload, user }) {
    const { message, type, vkId } = services[payload.service];

    await respond(generateRandomCaption(message, { user }), { attachments: [{ type, id: vkId }] });
  },

  async subscriptions({ respond, user }) {
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
  },
  async 'subscriptions/subscription'({ respond, payload, user }) {
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
  },
  'poster/subscribe': handleCommonSubscribeButton,
  'playlists/subscribe': handleCommonSubscribeButton,
  'text_materials/subscribe': handleCommonSubscribeButton,
  'releases/subscribe': handleCommonSubscribeButton,
  'drawings/subscribe': handleCommonSubscribeButton,

  async soundfest({ respond, user, clientInfo }) {
    await respond(captions.soundfest_response(user), { keyboard: generateSoundfestKeyboard(clientInfo) });
  },
  async 'soundfest/go_to_event'({ respond }) {
    await respond(`${captions.soundfest_go_to_event_response}\n\n➡ ${links.soundfest_event}`);
  },
  async 'soundfest/buy_ticket'({ respond }) {
    await respond(`${captions.soundfest_buy_ticket_response}\n\n➡ ${links.soundfest_buy_ticket}`);
  },

  async admin({ respond }) {
    await respond(captions.choose_action, { keyboard: adminKeyboard });
  },

  async 'admin/drawings'({ respond }) {
    await respond(captions.choose_or_add_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
  },
  async 'admin/drawings/add'({ respond, user }) {
    user.state = {
      command: 'admin/drawings/add/set_name'
    };

    await respond(captions.enter_drawing_name);
  },
  async 'admin/drawings/add/set_name'({ respond, payload, user, message }) {
    const name = message.text;

    if (name.length > 40) {
      user.state = { ...payload };

      await respond(captions.name_too_long);

      return;
    }

    user.state = {
      command: 'admin/drawings/add/set_post',
      name
    };

    await respond(captions.send_drawing_post);
  },
  async 'admin/drawings/add/set_post'({ respond, payload, user, message }) {
    const postId = getPostId(message);

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
  },
  async 'admin/drawings/add/set_expires_at'({ respond, payload, user, message }) {
    const now = moment();
    const expiresAt = moment(message.text, 'DD.MM');

    if (expiresAt.isBefore(now)) {
      expiresAt.add(1, 'year');
    }

    if (expiresAt.isValid() && expiresAt.isAfter(now)) {
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
  },
  async 'admin/drawings/drawing'({ respond, payload }) {
    const drawing = await Drawing.findByPk(payload.drawingId);

    if (drawing) {
      await respond(`${drawing.name} (окончание розыгрыша - ${moment(drawing.expiresAt).format('DD MMMM YYYY')})`, {
        attachments: [{ type: 'wall', id: drawing.postId }],
        keyboard: generateAdminDrawingMenuKeyboard(drawing)
      });
    } else {
      await respond(captions.admin_no_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
    }
  },
  async 'admin/drawings/drawing/edit_name'({ respond, payload, user }) {
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
  },
  async 'admin/drawings/drawing/edit_name/message'({ respond, payload, message }) {
    const drawing = await Drawing.findByPk(payload.drawingId);

    if (drawing) {
      drawing.name = message.text;

      await drawing.save();
      await respond(captions.drawing_edited);
    } else {
      await respond(captions.admin_no_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
    }
  },
  async 'admin/drawings/drawing/edit_post'({ respond, payload, user }) {
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
  },
  async 'admin/drawings/drawing/edit_post/message'({ respond, payload, user, message }) {
    const drawing = await Drawing.findByPk(payload.drawingId);

    if (drawing) {
      const postId = getPostId(message);

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
  },
  async 'admin/drawings/drawing/edit_expires_at'({ respond, payload, user }) {
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
  },
  async 'admin/drawings/drawing/edit_expires_at/message'({ respond, payload, user, message }) {
    const drawing = await Drawing.findByPk(payload.drawingId);

    if (drawing) {
      const now = moment();
      const expiresAt = moment(message.text, 'DD.MM');

      if (expiresAt.isBefore(now)) {
        expiresAt.add(1, 'year');
      }

      if (expiresAt.isValid() && expiresAt.isAfter(now)) {
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
  },
  async 'admin/drawings/drawing/delete'({ respond, payload, user }) {
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
  },
  async 'admin/drawings/drawing/delete/confirmation'({ respond, payload, message }) {
    const drawing = await Drawing.findByPk(payload.drawingId);

    if (drawing) {
      if (positiveAnswers.includes(message.text.toLowerCase())) {
        drawing.active = false;

        await drawing.save();
        await respond(captions.drawing_deleted, { keyboard: await generateAdminDrawingsKeyboard() });
      } else {
        await respond(captions.choose_action, { keyboard: generateAdminDrawingMenuKeyboard(drawing) });
      }
    } else {
      await respond(captions.admin_no_drawing, { keyboard: await generateAdminDrawingsKeyboard() });
    }
  },

  async 'admin/stats'({ respond }) {
    await respond(captions.stats_response, { keyboard: adminStatsKeyboard });
  },
  async 'admin/stats/subscriptions'({ respond }) {
    await respond(captions.choose_period, { keyboard: adminSubscriptionStatsKeyboard });
  },
  async 'admin/stats/subscriptions/period'({ respond, payload }) {
    await respond(await getSubscriptionStats(payload.period));
  },
  async 'admin/stats/clicks'({ respond }) {
    await respond(captions.choose_period, { keyboard: adminClickStatsKeyboard });
  },
  async 'admin/stats/clicks/period'({ respond, payload }) {
    await respond(await getClickStats(payload.period));
  },
  async 'admin/stats/group'({ respond }) {
    await respond(captions.choose_period, { keyboard: adminGroupStatsKeyboard });
  },
  async 'admin/stats/group/period'({ respond, payload }) {
    await respond(await getGroupStats(payload.period));
  },
  async 'admin/stats/reposts'({ respond }) {
    await respond(captions.choose_period, { keyboard: adminRepostStatsKeyboard });
  },
  async 'admin/stats/reposts/period'({ respond, payload }) {
    await respond(await getRepostStats(payload.period));
  },

  async 'admin/send_message_to_users'({ respond }) {
    await respond(captions.choose_group, { keyboard: adminSendMessageToUsersKeyboard });
  },
  async 'admin/send_message_to_users/group'({ respond, payload, user }) {
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
  },
  async 'admin/send_message_to_users/group/set_group'({ respond, payload, user, message }) {
    const userIds = message.text.split(/[,\s]+/).filter((id) => /^\d+$/.test(id)).map((id) => +id);

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
  },
  async 'admin/send_message_to_users/group/set_text'({ respond, payload, user, message }) {
    user.state = {
      command: 'admin/send_message_to_users/group/set_post',
      group: payload.group,
      text: message.text
    };

    await respond(captions.enter_message_post);
  },
  async 'admin/send_message_to_users/group/set_post'({ respond, payload, user, message }) {
    const postId = getPostId(message);

    if (postId || negativeAnswers.includes(message.text.toLowerCase())) {
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
  },
  async 'admin/send_message_to_users/group/set_image'({ respond, payload, user, message }) {
    const photoAttachment = (message.attachments.find(({ type }) => type === 'photo') || null) as PhotoAttachment | null;

    if (photoAttachment || negativeAnswers.includes(message.text.toLowerCase())) {
      user.state = {
        command: 'admin/send_message_to_users/group/set_refresh_keyboard',
        group: payload.group,
        text: payload.text,
        post: payload.post,
        image: photoAttachment && `${photoAttachment.photo.owner_id}_${photoAttachment.photo.id}${
          photoAttachment.photo.access_key ? `_${photoAttachment.photo.access_key}` : ''
        }`
      };

      await respond(captions.need_to_refresh_keyboard);
    } else {
      user.state = { ...payload };

      await respond(captions.enter_message_image);
    }
  },
  async 'admin/send_message_to_users/group/set_refresh_keyboard'({ respond, payload, user, message }) {
    const isPositiveAnswer = positiveAnswers.includes(message.text.toLowerCase());
    const isNegativeAnswer = negativeAnswers.includes(message.text.toLowerCase());

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

      (async () => {
        try {
          if (payload.group === 'all') {
            await sendVkMessageToAllConversations(payload.text, sendOptions);
          } else if (isNumbersArray(payload.group)) {
            await sendVKMessages(payload.group, payload.text, sendOptions);
          } else {
            await sendVkMessageToSubscribedUsers(payload.group, payload.text, sendOptions);
          }
        } catch (err) {
          Logger.error(err, 'send messages error');
        }
      })();

      await respond(captions.message_successfully_sent);
    } else {
      user.state = { ...payload };

      await respond(captions.need_to_refresh_keyboard);
    }
  },
};

async function handleCommonSubscribeButton<T extends SubscribeToSectionButtonPayload>({ respond, payload, user, clientInfo }: ActionOptions<T>) {
  const { subscription, generateKeyboard } = subscriptionMap[payload.command];

  if (payload.subscribed) {
    user.unsubscribe(subscription);

    await user.save();
    await respond(
      `${captions.unsubscribe_response(user, subscription)} ${captions.subscribeOrUnsubscribeFooter(user)}`,
      { keyboard: await generateKeyboard(user, clientInfo) }
    );
  } else {
    user.subscribe(subscription);

    await user.save();
    await respond(
      `${captions.subscribe_response(user, subscription)} ${captions.subscribeOrUnsubscribeFooter(user)}`,
      { keyboard: await generateKeyboard(user, clientInfo) }
    );
  }
}

export default actionMap;
