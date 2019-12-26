import * as _ from 'lodash';
import moment = require('moment-timezone');

import {
  BackButtonDest,
  ButtonColor,
  ButtonPayload,
  ClientInfo,
  Concert,
  Keyboard,
  KeyboardButton,
  Service,
  SubscribeToSectionButtonPayload,
  Subscription,
} from './types';
import {
  captions,
  genreButtons,
  genreNames,
  links,
  playlistsGenreButtons,
  playlistsGenreNames,
  services,
  subscriptionNames,
  subscriptionButtons,
} from './constants';
import {
  getShortDayString,
  // getHolidays,
  getWeekString,
  isConcertInGenre
} from './helpers';
import User from './database/User';
import Drawing from './database/Drawing';

export interface SubscriptionParams {
  subscription: Subscription;
  generateKeyboard(user: User, clientInfo: ClientInfo): Keyboard | Promise<Keyboard>;
}

export const backButtonText: Record<BackButtonDest, string> = {
  [BackButtonDest.MAIN]: captions.main_menu,
  [BackButtonDest.POSTER]: captions.poster,
  [BackButtonDest.PLAYLISTS]: captions.playlists,
  [BackButtonDest.ADMIN]: captions.admin_section,
  [BackButtonDest.ADMIN_DRAWINGS]: captions.drawings,
  [BackButtonDest.ADMIN_STATS]: captions.stats,
};

export const subscriptionMap: Record<SubscribeToSectionButtonPayload['command'], SubscriptionParams> = {
  'poster/subscribe': {
    subscription: Subscription.POSTER,
    generateKeyboard: generatePosterKeyboard
  },
  'playlists/subscribe': {
    subscription: Subscription.PLAYLISTS,
    generateKeyboard: generatePlaylistsKeyboard
  },
  'text_materials/subscribe': {
    subscription: Subscription.TEXT_MATERIALS,
    generateKeyboard: generateTextMaterialsKeyboard
  },
  'releases/subscribe': {
    subscription: Subscription.RELEASES,
    generateKeyboard: generateReleasesKeyboard
  },
  'drawings/subscribe': {
    subscription: Subscription.DRAWINGS,
    generateKeyboard: generateDrawingsKeyboard
  },
};

export function generateMainKeyboard(isManager: boolean): Keyboard {
  return {
    one_time: false,
    buttons: [
      [
        generateTextButton(captions.poster, { command: 'poster' }),
        generateTextButton(captions.playlists, { command: 'playlists' }),
        generateTextButton(captions.releases, { command: 'releases' }),
      ],
      [
        generateTextButton(captions.drawings, { command: 'drawings' }),
        generateTextButton(captions.text_materials, { command: 'text_materials' }),
        generateTextButton(captions.services, { command: 'services' }),
      ],
      [
        generateTextButton(captions.subscriptions, { command: 'subscriptions' }),
        generateTextButton(captions.write_to_soundcheck, { command: 'write_to_soundcheck' }),
      ],
      [
        generateTextButton(captions.soundfest, { command: 'soundfest' }, ButtonColor.POSITIVE),
      ],
      ...(
        isManager
          ? [[generateTextButton(captions.admin_section, { command: 'admin' }, ButtonColor.POSITIVE)]]
          : []
      ),
    ]
  };
}

export function generatePosterKeyboard(user: User): Keyboard {
  return {
    one_time: false,
    buttons: [
      [
        generateTextButton(captions.day, { command: 'poster/type', type: 'day' }),
        generateTextButton(captions.week, { command: 'poster/type', type: 'week' }),
        generateTextButton(captions.by_genres, { command: 'poster/type', type: 'genres' }),
      ],
      [generateSubscribeButton(user, 'poster/subscribe')],
      [generateBackButton()],
    ]
  };
}

export function generateWeekPosterKeyboard(): Keyboard {
  const thisWeek = moment().startOf('week');
  const weeks = [
    thisWeek,
    thisWeek.clone().add(1, 'week'),
    thisWeek.clone().add(2, 'week'),
    thisWeek.clone().add(3, 'week'),
  ];

  return {
    one_time: false,
    buttons: [
      ...weeks.map((week, index) => [
        generateTextButton(index === 0 ? captions.this_week : getWeekString(week), { command: 'poster/type/week', weekStart: +week })
      ]),
      [generateBackButton(BackButtonDest.POSTER)],
      [generateBackButton()],
    ]
  };
}

export async function generateDayPosterKeyboard(concertGroups: Record<string, Concert[]>): Promise<Keyboard> {
  const days: number[] = [];

  _.forEach(concertGroups, (_, day) => {
    if (days.length === 28) {
      return false;
    }

    days.push(+day);
  });

  // const holidays = await getHolidays(moment(days[0]), moment(_.last(days)));
  const buttons = days.map((day) => {
    const dayMoment = moment(+day);
    // const dayOfTheWeek = dayMoment.weekday();

    return generateTextButton(
      getShortDayString(dayMoment),
      { command: 'poster/type/day', dayStart: +day },
      // dayOfTheWeek > 4 || holidays.some((holiday) => holiday.isSame(dayMoment, 'day')) ? ButtonColor.POSITIVE : ButtonColor.PRIMARY
      ButtonColor.PRIMARY
    );
  });

  return {
    one_time: false,
    buttons: [
      ..._.chunk(buttons, 4),
      [generateBackButton(BackButtonDest.POSTER)],
      [generateBackButton()],
    ]
  };
}

export function generateGenrePosterKeyboard(allConcerts: Concert[]): Keyboard {
  return {
    one_time: false,
    buttons: [
      ...genreButtons.map((buttons) => (
        buttons.map((genre) => {
          const hasConcerts = allConcerts.some((concert) => isConcertInGenre(concert, genre));

          return generateTextButton(
            genreNames[genre],
            { command: 'poster/type/genre', genre },
            hasConcerts ? ButtonColor.PRIMARY : ButtonColor.SECONDARY
          );
        })
      )),
      [generateBackButton(BackButtonDest.POSTER)],
      [generateBackButton()],
    ]
  };
}

export function generatePlaylistsKeyboard(user: User): Keyboard {
  return {
    one_time: false,
    buttons: [
      [
        generateTextButton(captions.playlists_all, { command: 'playlists/all' }),
        generateTextButton(captions.playlists_thematic, { command: 'playlists/thematic' }),
        generateTextButton(captions.playlists_genre, { command: 'playlists/genre' }),
      ],
      [generateSubscribeButton(user, 'playlists/subscribe')],
      [generateBackButton()],
    ]
  };
}

export function generateReleasesKeyboard(user: User): Keyboard {
  return {
    one_time: false,
    buttons: [
      [
        generateTextButton(captions.week_releases, { command: 'releases/week_releases' }),
      ],
      [
        generateTextButton(captions.digests, { command: 'releases/digests' }),
      ],
      [generateSubscribeButton(user, 'releases/subscribe')],
      [generateBackButton()],
    ]
  };
}

export const playlistsGenresKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    ...playlistsGenreButtons.map((buttons) => (
      buttons.map((genre) => generateTextButton(playlistsGenreNames[genre], { command: 'playlists/genre/type', genre }))
    )),
    [generateBackButton(BackButtonDest.PLAYLISTS)],
    [generateBackButton()],
  ]
};

export const servicesKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateServiceButton('stickers_design'),
      generateServiceButton('soundcheck_ads'),
    ],
    [generateBackButton()],
  ]
};

export function generateTextMaterialsKeyboard(user: User): Keyboard {
  return {
    one_time: false,
    buttons: [
      [
        generateTextButton(captions.longreads, { command: 'text_materials/longread' }),
        generateTextButton(captions.group_history, { command: 'text_materials/group_history' }),
      ],
      [generateSubscribeButton(user, 'text_materials/subscribe')],
      [generateBackButton()],
    ]
  };
}

export const writeToSoundcheckKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateTextButton(captions.tell_about_group, { command: 'write_to_soundcheck/tell_about_group' }),
      generateTextButton(captions.tell_about_release, { command: 'write_to_soundcheck/tell_about_release' }),
    ],
    [
      generateTextButton(captions.want_to_participate, { command: 'write_to_soundcheck/want_to_participate' }),
      generateTextButton(captions.tell_about_bug, { command: 'write_to_soundcheck/tell_about_bug' }),
    ],
    [
      generateTextButton(captions.write_to_soundcheck_other, { command: 'write_to_soundcheck/other' }),
    ],
    [generateBackButton()],
  ]
};

export function generateSoundfestKeyboard(clientInfo: ClientInfo): Keyboard {
  return {
    one_time: false,
    buttons: [
      [
        clientInfo.buttons.includes('open_link')
          ? generateLinkButton(captions.soundfest_go_to_event, links.soundfest_event, { command: 'soundfest/go_to_event', linkButton: true })
          : generateTextButton(captions.soundfest_go_to_event, { command: 'soundfest/go_to_event', linkButton: false }),
      ],
      [
        generateOpenAppButton(captions.soundfest_buy_ticket, 5575136, -189351237, { command: 'soundfest/buy_ticket' }),
      ],
      [generateBackButton()],
    ]
  };
}

export function generateSubscriptionsKeyboard(user: User): Keyboard {
  return {
    one_time: false,
    buttons: [
      ...subscriptionButtons.map((buttons) => (
        buttons.map((subscription) => {
          const subscribed = user.subscriptions.includes(subscription);

          return (
            generateTextButton(`${subscribed ? `✓ ` : ''}${subscriptionNames[subscription]}`, {
              command: 'subscriptions/subscription',
              subscription,
              subscribed
            }, subscribed ? ButtonColor.SECONDARY : ButtonColor.PRIMARY)
          );
        })
      )),
      [generateBackButton()],
    ]
  };
}

export const adminKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateTextButton(captions.drawings, { command: 'admin/drawings' }),
      generateTextButton(captions.stats, { command: 'admin/stats' }),
    ],
    [
      generateTextButton(captions.send_message_to_users, { command: 'admin/send_message_to_users' })
    ],
    [generateBackButton()],
  ]
};

export const adminStatsKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateTextButton(captions.subscriptions, { command: 'admin/stats/subscriptions' }),
      generateTextButton(captions.clicks, { command: 'admin/stats/clicks' }),
    ],
    [
      generateTextButton(captions.group, { command: 'admin/stats/group' }),
      generateTextButton(captions.reposts, { command: 'admin/stats/reposts' }),
    ],
    [generateBackButton(BackButtonDest.ADMIN)],
    [generateBackButton()],
  ]
};

export const adminSubscriptionStatsKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateTextButton(captions.all_time, { command: 'admin/stats/subscriptions/period', period: 'all_time' }),
    ],
    [
      generateTextButton(captions.today, { command: 'admin/stats/subscriptions/period', period: 'today' }),
      generateTextButton(captions.yesterday, { command: 'admin/stats/subscriptions/period', period: 'yesterday' }),
    ],
    [
      generateTextButton(captions.this_week, { command: 'admin/stats/subscriptions/period', period: 'this_week' }),
      generateTextButton(captions.prev_week, { command: 'admin/stats/subscriptions/period', period: 'prev_week' }),
    ],
    [
      generateTextButton(captions.this_month, { command: 'admin/stats/subscriptions/period', period: 'this_month' }),
      generateTextButton(captions.prev_month, { command: 'admin/stats/subscriptions/period', period: 'prev_month' }),
    ],
    [generateBackButton(BackButtonDest.ADMIN_STATS)],
    [generateBackButton(BackButtonDest.ADMIN)],
    [generateBackButton()],
  ]
};

export const adminClickStatsKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateTextButton(captions.today, { command: 'admin/stats/clicks/period', period: 'today' }),
      generateTextButton(captions.yesterday, { command: 'admin/stats/clicks/period', period: 'yesterday' }),
    ],
    [
      generateTextButton(captions.this_week, { command: 'admin/stats/clicks/period', period: 'this_week' }),
      generateTextButton(captions.prev_week, { command: 'admin/stats/clicks/period', period: 'prev_week' }),
    ],
    [
      generateTextButton(captions.this_month, { command: 'admin/stats/clicks/period', period: 'this_month' }),
      generateTextButton(captions.prev_month, { command: 'admin/stats/clicks/period', period: 'prev_month' }),
    ],
    [generateBackButton(BackButtonDest.ADMIN_STATS)],
    [generateBackButton(BackButtonDest.ADMIN)],
    [generateBackButton()],
  ]
};

export const adminGroupStatsKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateTextButton(captions.today, { command: 'admin/stats/group/period', period: 'today' }),
      generateTextButton(captions.yesterday, { command: 'admin/stats/group/period', period: 'yesterday' }),
    ],
    [
      generateTextButton(captions.this_week, { command: 'admin/stats/group/period', period: 'this_week' }),
      generateTextButton(captions.prev_week, { command: 'admin/stats/group/period', period: 'prev_week' }),
    ],
    [generateBackButton(BackButtonDest.ADMIN_STATS)],
    [generateBackButton(BackButtonDest.ADMIN)],
    [generateBackButton()],
  ]
};

export const adminRepostStatsKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateTextButton(captions.today, { command: 'admin/stats/reposts/period', period: 'today' }),
      generateTextButton(captions.yesterday, { command: 'admin/stats/reposts/period', period: 'yesterday' }),
    ],
    [
      generateTextButton(captions.this_week, { command: 'admin/stats/reposts/period', period: 'this_week' }),
      generateTextButton(captions.prev_week, { command: 'admin/stats/reposts/period', period: 'prev_week' }),
    ],
    [generateBackButton(BackButtonDest.ADMIN_STATS)],
    [generateBackButton(BackButtonDest.ADMIN)],
    [generateBackButton()],
  ]
};

export const adminSendMessageToUsersKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateTextButton(captions.to_all, { command: 'admin/send_message_to_users/group', group: 'all' }),
      generateTextButton(captions.to_all_subscribed, { command: 'admin/send_message_to_users/group', group: _.map(Subscription) }),
      generateTextButton(captions.to_group, { command: 'admin/send_message_to_users/group', group: 'pick' }),
    ],
    ...subscriptionButtons.map((buttons) => (
      buttons.map((subscription) => (
        generateTextButton(subscriptionNames[subscription], {
          command: 'admin/send_message_to_users/group',
          group: [subscription]
        })
      ))
    )),
    [generateBackButton(BackButtonDest.ADMIN)],
    [generateBackButton()],
  ]
};

export async function generateAdminDrawingsKeyboard(): Promise<Keyboard> {
  return {
    one_time: false,
    buttons: [
      ...(await Drawing.getActiveDrawings()).map(({ id, name }) => [
        generateTextButton(name, { command: 'admin/drawings/drawing', drawingId: id })
      ]),
      [
        generateTextButton(captions.add_drawing, { command: 'admin/drawings/add' }, ButtonColor.POSITIVE),
      ],
      [generateBackButton(BackButtonDest.ADMIN)],
      [generateBackButton()],
    ]
  };
}

export function generateAdminDrawingMenuKeyboard(drawing: Drawing): Keyboard {
  return {
    one_time: false,
    buttons: [
      [generateTextButton(captions.edit_drawing_name, { command: 'admin/drawings/drawing/edit_name', drawingId: drawing.id })],
      [generateTextButton(captions.edit_drawing_post, { command: 'admin/drawings/drawing/edit_post', drawingId: drawing.id })],
      [generateTextButton(captions.edit_drawing_expires_at, { command: 'admin/drawings/drawing/edit_expires_at', drawingId: drawing.id })],
      [generateTextButton(captions.delete_drawing, { command: 'admin/drawings/drawing/delete', drawingId: drawing.id }, ButtonColor.NEGATIVE)],
      [generateBackButton(BackButtonDest.ADMIN_DRAWINGS)],
      [generateBackButton(BackButtonDest.ADMIN)],
      [generateBackButton()],
    ]
  };
}

export async function generateDrawingsKeyboard(user: User): Promise<Keyboard> {
  const buttons = (await Drawing.getActiveDrawings()).map(({ id, name }) => [generateTextButton(name, { command: 'drawings/drawing', drawingId: id })]);

  return {
    one_time: false,
    buttons: [
      ...buttons,
      [generateSubscribeButton(user, 'drawings/subscribe')],
      [generateBackButton()],
    ]
  };
}

export function generateTextButton(text: string, payload: ButtonPayload, color: ButtonColor = ButtonColor.PRIMARY): KeyboardButton {
  return {
    action: {
      type: 'text',
      label: text,
      payload: JSON.stringify(payload)
    },
    color,
  };
}

export function generateLinkButton(text: string, url: string, payload: ButtonPayload, color: ButtonColor = ButtonColor.PRIMARY): KeyboardButton {
  return {
    action: {
      type: 'open_link',
      link: url,
      label: text,
      payload: JSON.stringify(payload)
    },
    color,
  };
}

export function generateOpenAppButton(
  text: string,
  appId: number,
  ownerId: number | null,
  payload: ButtonPayload,
  color: ButtonColor = ButtonColor.PRIMARY
): KeyboardButton {
  return {
    action: {
      type: 'open_app',
      app_id: appId,
      ...(ownerId ? { owner_id: ownerId } : {}),
      label: text,
      payload: JSON.stringify(payload)
    },
    color,
  };
}

export function generateBackButton(dest: BackButtonDest = BackButtonDest.MAIN): KeyboardButton {
  return generateTextButton(`← ${backButtonText[dest]}`, { command: 'back', dest }, ButtonColor.SECONDARY);
}

export function generateServiceButton(service: Service): KeyboardButton {
  return generateTextButton(services[service].name, {
    command: 'services/service',
    service
  });
}

export function generateSubscribeButton(user: User, command: SubscribeToSectionButtonPayload['command']): KeyboardButton {
  const { subscription } = subscriptionMap[command];
  const subscribed = user.subscriptions.includes(subscription);

  return generateTextButton(
    subscribed ? `✓ Вы уже подписаны` : 'Подписаться',
    { command, subscribed },
    subscribed ? ButtonColor.SECONDARY : ButtonColor.POSITIVE
  );
}
