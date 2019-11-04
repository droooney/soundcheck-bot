import moment = require('moment-timezone');

import {
  BackButtonDest,
  ButtonColor,
  ButtonPayload,
  Drawing,
  Keyboard,
  KeyboardButton,
  Subscription,
  User,
} from './types';
import { genreNames, genresButtons, subscriptionNames, subscriptionButtons } from './constants';
import Database from './Database';
import { getWeekString } from './helpers';
import captions from './captions';

export const backButtonText: Record<BackButtonDest, string> = {
  [BackButtonDest.MAIN]: captions.main_menu,
  [BackButtonDest.POSTER]: captions.poster,
  [BackButtonDest.ADMIN]: captions.admin_section,
  [BackButtonDest.ADMIN_DRAWINGS]: captions.drawings,
};

export function generateMainKeyboard(isManager: boolean): Keyboard {
  return {
    one_time: false,
    buttons: [
      [
        generateButton(captions.poster, { command: 'poster' }),
        generateButton(captions.playlists, { command: 'playlist' }),
        generateButton(captions.releases, { command: 'releases' }),
      ],
      [
        generateButton(captions.drawings, { command: 'drawings' }),
        generateButton(captions.text_materials, { command: 'text_materials' }),
        generateButton(captions.audio_materials, { command: 'audio_materials' }),
      ],
      [
        generateButton(captions.write_to_soundcheck, { command: 'write_to_soundcheck' }),
      ],
      [
        generateButton(captions.services, { command: 'services' }),
        generateButton(captions.subscriptions, { command: 'subscriptions' }),
      ],
      ...(
        isManager
          ? [[generateButton(captions.admin_section, { command: 'admin' }, ButtonColor.POSITIVE)]]
          : []
      ),
      [
        generateButton(captions.refresh_keyboard, { command: 'refresh_keyboard' }, ButtonColor.POSITIVE),
      ],
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
        generateButton(captions.by_genres, { command: 'poster/type', type: 'genres' })
      ],
      [generateSubscribeButton(user, Subscription.POSTER, 'poster/subscribe')],
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
    thisWeek.clone().add(3, 'week')
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
      generateButton(captions.stickers_design, {
        command: 'services/service',
        service: { type: 'market', id: 'market-177574047_3113786' }
      }),
      generateButton(captions.soundcheck_ads, {
        command: 'services/service',
        service: { type: 'market', id: 'market-177574047_2685381' }
      }),
    ],
    [generateBackButton()],
  ]
};

export const textMaterialsKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateButton(captions.longreads, { command: 'text_materials/longread' }),
      generateButton(captions.group_history, { command: 'text_materials/group_history' }),
    ],
    [generateBackButton()],
  ]
};

export const audioMaterialsKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateButton(captions.digests, { command: 'audio_materials/digests' }),
      // generateButton(captions.podcasts, { command: 'audio_materials/podcasts' }),
    ],
    [generateBackButton()],
  ]
};

export const writeToSoundcheckKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [generateButton(captions.tell_about_group, { command: 'write_to_soundcheck/tell_about_group' })],
    [generateButton(captions.tell_about_release, { command: 'write_to_soundcheck/tell_about_release' })],
    [generateButton(captions.collaboration, { command: 'write_to_soundcheck/collaboration' })],
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
    [generateBackButton()],
  ]
};

export const adminStatsKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateButton(captions.subscriptions, { command: 'admin/stats/subscriptions' }),
    ],
    [generateBackButton(BackButtonDest.ADMIN)],
    [generateBackButton()],
  ]
};

export function generateAdminDrawingsKeyboard(): Keyboard {
  return {
    one_time: false,
    buttons: [
      ...Database.drawings.map(({ id, name }) => [
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
      [generateButton(captions.delete_drawing, { command: 'admin/drawings/drawing/delete', drawingId: drawing.id }, ButtonColor.NEGATIVE)],
      [generateBackButton(BackButtonDest.ADMIN_DRAWINGS)],
      [generateBackButton(BackButtonDest.ADMIN)],
      [generateBackButton()],
    ]
  };
}

export function generateDrawingsKeyboard(): Keyboard | null {
  const buttons = Database.drawings.map(({ id, name }) => [generateButton(name, { command: 'drawings/drawing', drawingId: id })]);

  if (!buttons.length) {
    return null;
  }

  return {
    one_time: false,
    buttons: [
      ...buttons,
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

export function generateSubscribeButton(
  user: User,
  subscription: Subscription,
  command: 'poster/subscribe'
): KeyboardButton {
  const subscribed = user.subscriptions.includes(subscription);

  return generateButton(
    subscribed ? `✓ Вы уже подписаны` : 'Подписаться',
    { command, subscribed },
    subscribed ? ButtonColor.SECONDARY : ButtonColor.POSITIVE
  );
}
