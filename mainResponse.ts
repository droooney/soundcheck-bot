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
  getWeeklyConcerts,
  getWeekString,
  sendVKMessage
} from './helpers';
import { BackButtonDest, Body, ButtonColor, ButtonPayload, Keyboard, KeyboardButton } from './types';

const generateButton = (text: string, payload: ButtonPayload, color: ButtonColor = ButtonColor.PRIMARY): KeyboardButton => {
  return {
    action: {
      type: 'text',
      label: text,
      payload: JSON.stringify(payload)
    },
    color,
  };
};
const backButtonText: Record<BackButtonDest, string> = {
  [BackButtonDest.MAIN]: 'Главное меню',
  [BackButtonDest.POSTER]: 'Афиша'
};
const generateBackButton = (dest: BackButtonDest = BackButtonDest.MAIN): KeyboardButton => {
  return generateButton(backButtonText[dest], { command: 'back', dest }, ButtonColor.SECONDARY);
};
const mainKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    [
      generateButton('Афиша', { command: 'poster' }),
      generateButton('Плейлисты', { command: 'playlist' }),
      generateButton('Лонгриды', { command: 'longread' }),
    ],
    [
      generateButton('Рассказать о группе', { command: 'tell_about_group' }),
      generateButton('Сообщить о релизе', { command: 'tell_about_release' }),
    ],
    [
      generateButton('Обновить клавиатуру', { command: 'refresh_keyboard' }, ButtonColor.POSITIVE),
    ],
  ]
};
const GENRES = ['Поп-рок', 'Джаз', 'Инди-рок', 'Рок', 'Хип-хоп'];
const genresKeyboard: Keyboard = {
  one_time: false,
  buttons: [
    ..._.chunk(GENRES.map((genre) => generateButton(genre, { command: 'poster_genre', genre })), 4),
    [generateBackButton(BackButtonDest.POSTER)],
    [generateBackButton()],
  ]
};
const TELL_ABOUT_GROUP_HASHTAG = '#tell_about_group';
const RELEASE_HASHTAG = '#release';
const TELL_ABOUT_GROUP_TARGET = 175810060;
const RELEASES_TARGET = 175810060;

export default async (ctx: Context) => {
  const body: Body = ctx.request.body;

  console.log('bot message', body);

  if (body.type === 'confirmation') {
    ctx.body = 'afcb8751';
  } else if (body.type === 'message_new') {
    const respond = async (message: string, keyboard?: Keyboard) => {
      await sendVKMessage(body.object.peer_id, message, keyboard);
    };
    let payload: ButtonPayload | null = null;

    if (body.object.payload) {
      try {
        payload = JSON.parse(body.object.payload);
      } catch (err) {}
    }

    if (payload) {
      console.log(payload);

      command: if (payload.command === 'start') {
        await respond('Добро пожаловать в SoundCheck - Музыка Екатеринбурга. Что Вас интересует?', mainKeyboard);
      } else if (payload.command === 'back' && payload.dest === 'main') {
        await respond('Выберите действие', mainKeyboard);
      } else if (payload.command === 'poster' || (payload.command === 'back' && payload.dest === 'poster')) {
        await respond('Выберите тип афиши', {
          one_time: false,
          buttons: [
            [
              generateButton('День', { command: 'poster_type', type: 'day' }),
              generateButton('Неделя', { command: 'poster_type', type: 'week' }),
              generateButton('По жанрам', { command: 'poster_type', type: 'genres' })
            ],
            [generateBackButton()],
          ]
        });
      } else if (payload.command === 'poster_type') {
        if (payload.type === 'day') {
          const upcomingConcerts = await getConcerts(moment().startOf('day'));

          if (!upcomingConcerts.length) {
            await respond('В ближайшее время концертов нет');

            break command;
          }

          const concertsByDays = getConcertsByDays(upcomingConcerts);
          const buttons: KeyboardButton[] = [];

          _.forEach(concertsByDays, (_, day) => {
            if (buttons.length === 28) {
              return false;
            }

            buttons.push(generateButton(capitalizeWords(moment(+day).format('DD MMMM')), { command: 'poster_day', dayStart: +day }));
          });

          await respond('Выберите день', {
            one_time: false,
            buttons: [
              ..._.chunk(buttons, 4),
              [generateBackButton(BackButtonDest.POSTER)],
              [generateBackButton()],
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

          await respond('Выберите неделю', {
            one_time: false,
            buttons: [
              ...weeks.map((week, index) => [
                generateButton(index === 0 ? 'Эта неделя' : getWeekString(week), { command: 'poster_week', weekStart: +week })
              ]),
              [generateBackButton(BackButtonDest.POSTER)],
              [generateBackButton()],
            ]
          });
        } else if (payload.type === 'genres') {
          await respond('Выберите жанр', genresKeyboard);
        }
      } else if (payload.command === 'poster_day') {
        const concerts = await getDailyConcerts(moment(payload.dayStart));

        await respond(
          concerts.length
            ? getConcertsString(concerts)
            : 'В этот день концертов нет'
        );
      } else if (payload.command === 'poster_week') {
        const today = +moment().startOf('day');
        const concerts = (await getWeeklyConcerts(moment(payload.weekStart))).filter(({ startTime }) => +startTime >= today);
        const groups = getConcertsByDays(concerts);

        console.log(getConcertsByDaysString(groups).length);

        await respond(
          concerts.length
            ? getConcertsByDaysString(groups)
            : 'На эту неделю концертов нет'
        );
      } else if (payload.command === 'poster_genre') {
        const genre = payload.genre;
        const allConcerts = await getConcerts(moment().startOf('day'));
        const genreConcerts = allConcerts.filter(({ genres }) => genres.includes(genre));

        await respond(
          genreConcerts.length
            ? getConcertsByDaysString(getConcertsByDays(genreConcerts))
            : `В ближайшее время концертов в жанре "${genre}" нет`
        );
      } else if (payload.command === 'playlist') {
        await respond('Смотри плейлисты тут: https://vk.com/soundcheck_ural/music_selections');
      } else if (payload.command === 'longread') {
        await respond('Смотри лонгриды тут: https://vk.com/@soundcheck_ural');
      } else if (payload.command === 'tell_about_group') {
        await respond(`Испольхуйте хэштег ${TELL_ABOUT_GROUP_HASHTAG}`);
      } else if (payload.command === 'tell_about_release') {
        await respond(`Испольхуйте хэштег ${RELEASE_HASHTAG}`);
      } else if (payload.command === 'refresh_keyboard') {
        await respond('Клавиатура обновлена', mainKeyboard);
      }
    } else {
      const text = body.object.text;

      if (text.includes(TELL_ABOUT_GROUP_HASHTAG)) {
        await Promise.all([
          respond('Рассказ о группе принят'),
          sendVKMessage(TELL_ABOUT_GROUP_TARGET, 'Рассказ о группе', undefined, [body.object.id])
        ]);
      } else if (text.includes(RELEASE_HASHTAG)) {
        await Promise.all([
          respond('Релиз принят'),
          sendVKMessage(RELEASES_TARGET, 'Релиз', undefined, [body.object.id])
        ]);
      }
    }

    ctx.body = 'ok';
  } else {
    ctx.body = 'ok';
  }
}
