import { BackButtonDest, ButtonColor, ButtonPayload, Keyboard, KeyboardButton } from './types';
import { genreNames, GENRES_BUTTONS } from './constants';

export const backButtonText: Record<BackButtonDest, string> = {
  [BackButtonDest.MAIN]: 'Главное меню',
  [BackButtonDest.POSTER]: 'Афиша',
  [BackButtonDest.FOR_MUSICIANS]: 'Для музыкантов',
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
        generateButton('Для музыкантов', { command: 'for_musicians' }),
        generateButton('Сотрудничество', { command: 'collaboration' }),
      ],
      ...(
        isManager
          ? [[generateButton('Админка', { command: 'admin' })]]
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
      buttons.map((genre) => generateButton(genreNames[genre], { command: 'poster_genre', genre }))
    )),
    [generateBackButton(BackButtonDest.POSTER)],
    [generateBackButton()],
  ]
};

export const servicesKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateButton('Дизайн стикеров', { command: 'service', service: { type: 'market', id: 'market-177574047_3113786' } }),
      generateButton('Реклама в Soundcheck', { command: 'service', service: { type: 'market', id: 'market-177574047_2685381' } }),
    ],
    [generateBackButton(BackButtonDest.FOR_MUSICIANS)],
    [generateBackButton()],
  ]
};

export const textMaterialsKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateButton('Лонгриды', { command: 'longread' }),
      generateButton('Истории групп', { command: 'group_history' }),
    ],
    [generateBackButton()],
  ]
};

export const forMusiciansKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [generateButton('Рассказать о группе', { command: 'tell_about_group' })],
    [generateButton('Сообщить о релизе', { command: 'tell_about_release' })],
    [generateButton('Услуги', { command: 'services' })],
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
