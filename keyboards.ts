import moment = require('moment-timezone');

import {
  BackButtonDest,
  ButtonColor,
  ButtonPayload,
  Keyboard,
  KeyboardButton,
  Service,
  SubscribeToSectionButtonPayload,
  Subscription,
} from './types';
import {
  captions,
  genreNames,
  genresButtons,
  services,
  subscriptionNames,
  subscriptionButtons,
} from './constants';
import { getWeekString } from './helpers';
import User from './database/User';
import Drawing from './database/Drawing';

export interface SubscriptionParams {
  subscription: Subscription;
  generateKeyboard(user: User): Keyboard | Promise<Keyboard>;
}

export const backButtonText: Record<BackButtonDest, string> = {
  [BackButtonDest.MAIN]: captions.main_menu,
  [BackButtonDest.POSTER]: captions.poster,
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
        generateButton(captions.poster, { command: 'poster' }),
        generateButton(captions.playlists, { command: 'playlists' }),
        generateButton(captions.releases, { command: 'releases' }),
      ],
      [
        generateButton(captions.drawings, { command: 'drawings' }),
        generateButton(captions.text_materials, { command: 'text_materials' }),
      ],
      [
        generateButton(captions.services, { command: 'services' }),
        generateButton(captions.subscriptions, { command: 'subscriptions' }),
        generateButton(captions.write_to_soundcheck, { command: 'write_to_soundcheck' }),
      ],
      [
        generateButton(captions.soundfest, { command: 'soundfest' }, ButtonColor.POSITIVE),
      ],
      ...(
        isManager
          ? [[generateButton(captions.admin_section, { command: 'admin' }, ButtonColor.POSITIVE)]]
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
        generateButton(captions.day, { command: 'poster/type', type: 'day' }),
        generateButton(captions.week, { command: 'poster/type', type: 'week' }),
        generateButton(captions.by_genres, { command: 'poster/type', type: 'genres' }),
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
        generateButton(index === 0 ? captions.this_week : getWeekString(week), { command: 'poster/type/week', weekStart: +week })
      ]),
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
        generateButton(captions.playlists_all, { command: 'playlists/all' }),
        generateButton(captions.playlists_thematic, { command: 'playlists/thematic' }),
        generateButton(captions.playlists_genre, { command: 'playlists/genre' }),
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
        generateButton(captions.week_releases, { command: 'releases/week_releases' }),
      ],
      [
        generateButton(captions.digests, { command: 'releases/digests' }),
      ],
      [generateSubscribeButton(user, 'releases/subscribe')],
      [generateBackButton()],
    ]
  };
}

export const genresKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    ...genresButtons.map((buttons) => (
      buttons.map((genre) => generateButton(genreNames[genre], { command: 'poster/type/genre', genre }))
    )),
    [generateBackButton(BackButtonDest.POSTER)],
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
        generateButton(captions.longreads, { command: 'text_materials/longread' }),
        generateButton(captions.group_history, { command: 'text_materials/group_history' }),
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
      generateButton(captions.tell_about_group, { command: 'write_to_soundcheck/tell_about_group' }),
      generateButton(captions.tell_about_release, { command: 'write_to_soundcheck/tell_about_release' }),
    ],
    [
      generateButton(captions.want_to_participate, { command: 'write_to_soundcheck/want_to_participate' }),
      generateButton(captions.tell_about_bug, { command: 'write_to_soundcheck/tell_about_bug' }),
    ],
    [
      generateButton(captions.write_to_soundcheck_other, { command: 'write_to_soundcheck/other' }),
    ],
    [generateBackButton()],
  ]
};

export const soundfestKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateButton(captions.soundfest_go_to_event, { command: 'soundfest/go_to_event' }),
    ],
    [
      generateButton(captions.soundfest_buy_ticket, { command: 'soundfest/buy_ticket' }),
    ],
    [generateBackButton()],
  ]
};

export function generateSubscriptionsKeyboard(user: User): Keyboard {
  return {
    one_time: false,
    buttons: [
      ...subscriptionButtons.map((buttons) => (
        buttons.map((subscription) => {
          const subscribed = user.subscriptions.includes(subscription);

          return (
            generateButton(`${subscribed ? `✓ ` : ''}${subscriptionNames[subscription]}`, {
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
      generateButton(captions.drawings, { command: 'admin/drawings' }),
      generateButton(captions.stats, { command: 'admin/stats' }),
    ],
    [
      generateButton(captions.send_message_to_users, { command: 'admin/send_message_to_users' })
    ],
    [generateBackButton()],
  ]
};

export const adminStatsKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateButton(captions.subscriptions, { command: 'admin/stats/subscriptions' }),
      generateButton(captions.clicks, { command: 'admin/stats/clicks' }),
    ],
    [
      generateButton(captions.group, { command: 'admin/stats/group' }),
      generateButton(captions.reposts, { command: 'admin/stats/reposts' }),
    ],
    [generateBackButton(BackButtonDest.ADMIN)],
    [generateBackButton()],
  ]
};

export const adminSubscriptionStatsKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateButton(captions.all_time, { command: 'admin/stats/subscriptions/period', period: 'all_time' }),
    ],
    [
      generateButton(captions.today, { command: 'admin/stats/subscriptions/period', period: 'today' }),
      generateButton(captions.yesterday, { command: 'admin/stats/subscriptions/period', period: 'yesterday' }),
    ],
    [
      generateButton(captions.this_week, { command: 'admin/stats/subscriptions/period', period: 'this_week' }),
      generateButton(captions.prev_week, { command: 'admin/stats/subscriptions/period', period: 'prev_week' }),
    ],
    [
      generateButton(captions.this_month, { command: 'admin/stats/subscriptions/period', period: 'this_month' }),
      generateButton(captions.prev_month, { command: 'admin/stats/subscriptions/period', period: 'prev_month' }),
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
      generateButton(captions.today, { command: 'admin/stats/clicks/period', period: 'today' }),
      generateButton(captions.yesterday, { command: 'admin/stats/clicks/period', period: 'yesterday' }),
    ],
    [
      generateButton(captions.this_week, { command: 'admin/stats/clicks/period', period: 'this_week' }),
      generateButton(captions.prev_week, { command: 'admin/stats/clicks/period', period: 'prev_week' }),
    ],
    [
      generateButton(captions.this_month, { command: 'admin/stats/clicks/period', period: 'this_month' }),
      generateButton(captions.prev_month, { command: 'admin/stats/clicks/period', period: 'prev_month' }),
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
      generateButton(captions.today, { command: 'admin/stats/group/period', period: 'today' }),
      generateButton(captions.yesterday, { command: 'admin/stats/group/period', period: 'yesterday' }),
    ],
    [
      generateButton(captions.this_week, { command: 'admin/stats/group/period', period: 'this_week' }),
      generateButton(captions.prev_week, { command: 'admin/stats/group/period', period: 'prev_week' }),
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
      generateButton(captions.today, { command: 'admin/stats/reposts/period', period: 'today' }),
      generateButton(captions.yesterday, { command: 'admin/stats/reposts/period', period: 'yesterday' }),
    ],
    [
      generateButton(captions.this_week, { command: 'admin/stats/reposts/period', period: 'this_week' }),
      generateButton(captions.prev_week, { command: 'admin/stats/reposts/period', period: 'prev_week' }),
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
      generateButton(captions.to_all, { command: 'admin/send_message_to_users/group', group: 'all' }),
      generateButton(captions.to_group, { command: 'admin/send_message_to_users/group', group: 'pick' }),
    ],
    ...subscriptionButtons.map((buttons) => (
      buttons.map((subscription) => (
        generateButton(subscriptionNames[subscription], {
          command: 'admin/send_message_to_users/group',
          group: subscription
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
        generateButton(name, { command: 'admin/drawings/drawing', drawingId: id })
      ]),
      [
        generateButton(captions.add_drawing, { command: 'admin/drawings/add' }, ButtonColor.POSITIVE),
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
      [generateButton(captions.edit_drawing_name, { command: 'admin/drawings/drawing/edit_name', drawingId: drawing.id })],
      [generateButton(captions.edit_drawing_post, { command: 'admin/drawings/drawing/edit_post', drawingId: drawing.id })],
      [generateButton(captions.edit_drawing_expires_at, { command: 'admin/drawings/drawing/edit_expires_at', drawingId: drawing.id })],
      [generateButton(captions.delete_drawing, { command: 'admin/drawings/drawing/delete', drawingId: drawing.id }, ButtonColor.NEGATIVE)],
      [generateBackButton(BackButtonDest.ADMIN_DRAWINGS)],
      [generateBackButton(BackButtonDest.ADMIN)],
      [generateBackButton()],
    ]
  };
}

export async function generateDrawingsKeyboard(user: User): Promise<Keyboard> {
  const buttons = (await Drawing.getActiveDrawings()).map(({ id, name }) => [generateButton(name, { command: 'drawings/drawing', drawingId: id })]);

  return {
    one_time: false,
    buttons: [
      ...buttons,
      [generateSubscribeButton(user, 'drawings/subscribe')],
      [generateBackButton()],
    ]
  };
}

export function generateButton(text: string, payload: ButtonPayload, color: ButtonColor = ButtonColor.PRIMARY): KeyboardButton {
  return {
    action: {
      type: 'text',
      label: text,
      payload: JSON.stringify(payload)
    },
    color,
  };
}

export function generateBackButton(dest: BackButtonDest = BackButtonDest.MAIN): KeyboardButton {
  return generateButton(`← ${backButtonText[dest]}`, { command: 'back', dest }, ButtonColor.SECONDARY);
}

export function generateServiceButton(service: Service): KeyboardButton {
  return generateButton(services[service].name, {
    command: 'services/service',
    service
  });
}

export function generateSubscribeButton(user: User, command: SubscribeToSectionButtonPayload['command']): KeyboardButton {
  const { subscription } = subscriptionMap[command];
  const subscribed = user.subscriptions.includes(subscription);

  return generateButton(
    subscribed ? `✓ Вы уже подписаны` : 'Подписаться',
    { command, subscribed },
    subscribed ? ButtonColor.SECONDARY : ButtonColor.POSITIVE
  );
}
