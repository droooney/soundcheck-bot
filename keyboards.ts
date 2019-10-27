import * as _ from 'lodash';

import { BackButtonDest, ButtonColor, ButtonPayload, Keyboard, KeyboardButton } from './types';
import { GENRES } from './constants';

export const backButtonText: Record<BackButtonDest, string> = {
  [BackButtonDest.MAIN]: 'Главное меню',
  [BackButtonDest.POSTER]: 'Афиша'
};

export const mainKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateButton('Афиша', { command: 'poster' }),
      generateButton('Плейлисты', { command: 'playlist' }),
      generateButton('Лонгриды', { command: 'longread' }),
    ],
    [
      generateButton('Релизы', { command: 'releases' }),
      generateButton('Услуги', { command: 'services' }),
    ],
    [
      generateButton('Рассказать о группе', { command: 'tell_about_group' }),
      generateButton('Сообщить о релизе', { command: 'tell_about_release' }),
    ],
    [
      generateButton('🔄 Обновить клавиатуру', { command: 'refresh_keyboard' }, ButtonColor.POSITIVE),
    ],
  ]
};

export const genresKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    ..._.chunk(GENRES.map((genre) => generateButton(genre, { command: 'poster_genre', genre })), 4),
    [generateBackButton(BackButtonDest.POSTER)],
    [generateBackButton()],
  ]
};

export const servicesKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateButton('Дизайн стикеров', { command: 'service', serviceId: 'market-177574047_3113786' }),
      generateButton('Реклама в Soundcheck', { command: 'service', serviceId: 'market-177574047_2685381' }),
    ],
    [generateBackButton(BackButtonDest.MAIN)],
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
