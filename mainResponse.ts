import * as _ from 'lodash';
import moment = require('moment-timezone');
import { Context } from 'koa';

import {
  capitalizeWords,
  getConcerts,
  getConcertsByDays,
  getConcertsByDaysString,
  getConcertsString,
  getDailyConcerts,
  getWeekString,
  getWeeklyConcerts,
  sendVKRequest
} from './helpers';
import { Body, ButtonColor, ButtonPayload, Keyboard, KeyboardButton } from './types';

const generateButton = (text: string, color: ButtonColor | null, payload: ButtonPayload): KeyboardButton => {
  return {
    action: {
      type: 'text',
      label: text,
      payload: JSON.stringify(payload)
    },
    color: color || ButtonColor.PRIMARY,
  };
};
const generateBackButton = (dest: string): KeyboardButton => {
  return generateButton('Назад', ButtonColor.SECONDARY, { command: 'back', dest });
};
const mainKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateButton('Афиша', null, { command: 'poster' }),
      generateButton('Плейлисты', null, { command: 'playlist' }),
      generateButton('Лонгриды', null, { command: 'longread' }),
    ],
    [
      generateButton('Рассказать о группе', null, { command: 'tell_about_group' }),
      generateButton('Сообщить о релизе', null, { command: 'tell_about_release' }),
    ],
    [
      generateButton('Обновить клавиатуру', ButtonColor.POSITIVE, { command: 'refresh_keyboard' }),
    ],
  ]
};
const GENRES = ['Поп-рок', 'Джаз', 'Инди-рок', 'Рок', 'Хип-хоп'];
const genresKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    ..._.chunk(GENRES.map((genre) => generateButton(genre, null, { command: 'poster_genre', genre })), 4),
    [generateBackButton('poster')]
  ]
};

export default async (ctx: Context) => {
  const body: Body = ctx.request.body;

  console.log('bot message', body);

  if (body.type === 'confirmation') {
    ctx.body = 'afcb8751';
  } else if (body.type === 'message_new') {
    let payload: ButtonPayload | null = null;

    if (body.object.payload) {
      try {
        payload = JSON.parse(body.object.payload);
      } catch (err) {}
    }

    if (payload) {
      const sendMessage = async (message: string, keyboard?: Keyboard) => {
        const {
          data,
          status
        } = await sendVKRequest('messages.send', {
          peer_id: body.object.peer_id,
          random_id: Math.floor(Math.random() * 2 ** 32),
          message,
          keyboard: JSON.stringify(keyboard)
        });

        console.log('message sent', status, data);
      };

      console.log(payload);

      command: if (payload.command === 'start') {
        await sendMessage('Добро пожаловать в SoundCheck - Музыка Екатеринбурга. Что Вас интересует?', mainKeyboard);
      } else if (payload.command === 'back' && payload.dest === 'main') {
        await sendMessage('Выберите действие', mainKeyboard);
      } else if (payload.command === 'poster' || (payload.command === 'back' && payload.dest === 'poster')) {
        await sendMessage('Выберите период', {
          one_time: false,
          buttons: [
            [
              generateButton('День', null, { command: 'poster_type', type: 'day' }),
              generateButton('Неделя', null, { command: 'poster_type', type: 'week' }),
              generateButton('По жанрам', null, { command: 'poster_type', type: 'genres' })
            ],
            [generateBackButton('main')]
          ]
        });
      } else if (payload.command === 'poster_type') {
        if (payload.type === 'day') {
          const upcomingConcerts = await getConcerts(moment().startOf('day'));

          if (!upcomingConcerts.length) {
            await sendMessage('В ближайшее время концертов нет');

            break command;
          }

          const concertsByDays = getConcertsByDays(upcomingConcerts);
          const buttons: KeyboardButton[] = [];

          _.forEach(concertsByDays, (_, day) => {
            if (buttons.length === 28) {
              return false;
            }

            buttons.push(generateButton(
              capitalizeWords(moment(+day).format('DD MMMM')),
              null,
              { command: 'poster_day', dayStart: +day }
            ));
          });

          await sendMessage('Выберите день', {
            one_time: false,
            buttons: [
              ..._.chunk(buttons, 4),
              [generateBackButton('poster')]
            ]
          });
        } else if (payload.type === 'week') {
          const thisWeek = moment().startOf('week');
          const weeks = [
            thisWeek,
            thisWeek.clone().add(1, 'week'),
            thisWeek.clone().add(2, 'week'),
            thisWeek.clone().add(3, 'week')
          ];

          await sendMessage('Выберите неделю', {
            one_time: false,
            buttons: [
              ...weeks.map((week, index) => [
                generateButton(index === 0 ? 'Эта неделя' : getWeekString(week), null, { command: 'poster_week', weekStart: +week })
              ]),
              [generateBackButton('poster')]
            ]
          });
        } else if (payload.type === 'genres') {
          await sendMessage('Выберите день', genresKeyboard);
        }
      } else if (payload.command === 'poster_day') {
        const concerts = await getDailyConcerts(moment(payload.dayStart));

        await sendMessage(getConcertsString(concerts));
      } else if (payload.command === 'poster_week') {
        const concerts = await getWeeklyConcerts(moment(payload.weekStart));
        const groups = getConcertsByDays(concerts);

        console.log(getConcertsByDaysString(groups).length);

        await sendMessage(
          concerts.length
            ? getConcertsByDaysString(groups)
            : 'На эту неделю концертов нет'
        );
      } else if (payload.command === 'poster_genre') {
        const genre = payload.genre;
        const allConcerts = await getConcerts(moment().startOf('day'));
        const genreConcerts = allConcerts.filter(({ genres }) => genres.includes(genre));

        await sendMessage(
          genreConcerts.length
            ? getConcertsByDaysString(getConcertsByDays(genreConcerts))
            : `В ближайшее время концертов в жанре "${genre}" нет`
        );
      } else if (payload.command === 'playlist') {
        await sendMessage('Смотри плейлисты тут: https://vk.com/soundcheck_ural/music_selections');
      } else if (payload.command === 'longread') {
        await sendMessage('Смотри лонгриды тут: https://vk.com/@soundcheck_ural');
      } else if (payload.command === 'tell_about_group') {
        await sendMessage('Пиши Сане: https://vk.com/im?sel=38367670');
      } else if (payload.command === 'tell_about_release') {
        await sendMessage('Пиши Сане: https://vk.com/im?sel=38367670');
      } else if (payload.command === 'refresh_keyboard') {
        await sendMessage('Клавиатура обновлена', mainKeyboard);
      }
    }

    ctx.body = 'ok';
  } else {
    ctx.body = 'ok';
  }
}
