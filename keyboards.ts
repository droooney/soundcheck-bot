import moment = require('moment-timezone');

import { BackButtonDest, ButtonColor, ButtonPayload, Keyboard, KeyboardButton } from './types';
import { genreNames, GENRES_BUTTONS } from './constants';
import Database from './Database';
import { getWeekString } from './helpers';
import captions from './captions';

export const backButtonText: Record<BackButtonDest, string> = {
  [BackButtonDest.MAIN]: captions.main_menu,
  [BackButtonDest.POSTER]: captions.poster,
  [BackButtonDest.FOR_MUSICIANS]: captions.for_musicians,
  [BackButtonDest.ADMIN]: captions.admin_section
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
        generateButton(captions.text_materials, { command: 'text_materials' }),
        generateButton(captions.drawings, { command: 'drawings' }),
      ],
      [
        generateButton(captions.for_musicians, { command: 'for_musicians' }),
        generateButton(captions.collaboration, { command: 'collaboration' }),
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

export const posterKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateButton(captions.day, { command: 'poster/type', type: 'day' }),
      generateButton(captions.week, { command: 'poster/type', type: 'week' }),
      generateButton(captions.by_genres, { command: 'poster/type', type: 'genres' })
    ],
    [generateBackButton()],
  ]
};

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
    ...GENRES_BUTTONS.map((buttons) => (
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
        command: 'for_musicians/services/service',
        service: { type: 'market', id: 'market-177574047_3113786' }
      }),
      generateButton(captions.soundcheck_ads, {
        command: 'for_musicians/services/service',
        service: { type: 'market', id: 'market-177574047_2685381' }
      }),
    ],
    [generateBackButton(BackButtonDest.FOR_MUSICIANS)],
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

export const forMusiciansKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [generateButton(captions.tell_about_group, { command: 'for_musicians/tell_about_group' })],
    [generateButton(captions.tell_about_release, { command: 'for_musicians/tell_about_release' })],
    [generateButton(captions.services, { command: 'for_musicians/services' })],
    [generateBackButton()],
  ]
};

export const adminKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateButton(captions.drawings, { command: 'admin/drawings' })
    ],
    [generateBackButton()],
  ]
};

export const adminDrawingsKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateButton(captions.add_drawing, { command: 'admin/drawings/add' }, ButtonColor.POSITIVE)
    ],
    [generateBackButton(BackButtonDest.ADMIN)],
    [generateBackButton()],
  ]
};

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
