import { BackButtonDest, ButtonColor, ButtonPayload, Keyboard, KeyboardButton } from './types';
import { genreNames, GENRES_BUTTONS } from './constants';

export const backButtonText: Record<BackButtonDest, string> = {
  [BackButtonDest.MAIN]: 'Главное меню',
  [BackButtonDest.POSTER]: 'Афиша',
  [BackButtonDest.FOR_MUSICIANS]: 'Для музыкантов',
  [BackButtonDest.ADMIN]: 'Админка'
};

export function generateMainKeyboard(isManager: boolean): Keyboard {
  return {
    one_time: false,
    buttons: [
      [
        generateButton('Афиша', { command: 'poster' }),
        generateButton('Плейлисты', { command: 'playlist' }),
      ],
      [
        generateButton('Текстовые материалы', { command: 'text_materials' }),
        generateButton('Релизы', { command: 'releases' }),
      ],
      [
        generateButton('Розыгрыши', { command: 'drawings' }),
      ],
      [
        generateButton('Для музыкантов', { command: 'for_musicians' }),
        generateButton('Сотрудничество', { command: 'collaboration' }),
      ],
      ...(
        isManager
          ? [[generateButton('Админка', { command: 'admin' }, ButtonColor.POSITIVE)]]
          : []
      ),
      [
        generateButton('🔄 Обновить клавиатуру', { command: 'refresh_keyboard' }, ButtonColor.POSITIVE),
      ],
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
      generateButton('Дизайн стикеров', {
        command: 'for_musicians/services/service',
        service: { type: 'market', id: 'market-177574047_3113786' }
      }),
      generateButton('Реклама в Soundcheck', {
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
      generateButton('Лонгриды', { command: 'text_materials/longread' }),
      generateButton('Истории групп', { command: 'text_materials/group_history' }),
    ],
    [generateBackButton()],
  ]
};

export const forMusiciansKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [generateButton('Рассказать о группе', { command: 'for_musicians/tell_about_group' })],
    [generateButton('Сообщить о релизе', { command: 'for_musicians/tell_about_release' })],
    [generateButton('Услуги', { command: 'for_musicians/services' })],
    [generateBackButton()],
  ]
};

export const adminKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateButton('Розыгрыши', { command: 'admin/drawings' })
    ],
    [generateBackButton()],
  ]
};

export const adminDrawingsKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateButton('Добавить розыгрыши', { command: 'admin/drawings/add' }, ButtonColor.POSITIVE)
    ],
    [generateBackButton(BackButtonDest.ADMIN)],
    [generateBackButton()],
  ]
};

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
