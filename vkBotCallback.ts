import * as _ from 'lodash';
import moment = require('moment-timezone');
import { Context } from 'koa';

import {
  SendVkMessageOptions,

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
import { BackButtonDest, Body, ButtonColor, ButtonPayload, KeyboardButton } from './types';
import {
  TELL_ABOUT_GROUP_HASHTAG,
  RELEASE_HASHTAG,
  TELL_ABOUT_GROUP_TARGET,
  RELEASES_TARGET
} from './constants';
import {
  generateButton,
  generateBackButton,

  mainKeyboard,
  genresKeyboard,
  servicesKeyboard
} from './keyboards';

export default async (ctx: Context) => {
  const body: Body = ctx.request.body;

  console.log('bot message', body);

  if (body.type === 'confirmation') {
    ctx.body = 'afcb8751';
  } else if (body.type === 'message_new') {
    const respond = async (message: string, options: SendVkMessageOptions = {}) => {
      await sendVKMessage(body.object.peer_id, message, options);
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
        await respond('Добро пожаловать в SoundCheck - Музыка Екатеринбурга. Что Вас интересует?', { keyboard: mainKeyboard });
      } else if (payload.command === 'back' && payload.dest === 'main') {
        await respond('Выберите действие', { keyboard: mainKeyboard });
      } else if (payload.command === 'poster' || (payload.command === 'back' && payload.dest === 'poster')) {
        await respond('Выберите тип афиши', {
          keyboard: {
            one_time: false,
            buttons: [
              [
                generateButton('День', { command: 'poster_type', type: 'day' }),
                generateButton('Неделя', { command: 'poster_type', type: 'week' }),
                generateButton('По жанрам', { command: 'poster_type', type: 'genres' })
              ],
              [generateBackButton()],
            ]
          }
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

            const dayOfTheWeek = moment(+day).weekday();

            buttons.push(generateButton(
              capitalizeWords(moment(+day).format('DD MMMM')),
              { command: 'poster_day', dayStart: +day },
              dayOfTheWeek > 4 ? ButtonColor.POSITIVE : ButtonColor.PRIMARY
            ));
          });

          await respond('Выберите день', {
            keyboard: {
              one_time: false,
              buttons: [
                ..._.chunk(buttons, 4),
                [generateBackButton(BackButtonDest.POSTER)],
                [generateBackButton()],
              ]
            }
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
            keyboard: {
              one_time: false,
              buttons: [
                ...weeks.map((week, index) => [
                  generateButton(index === 0 ? 'Эта неделя' : getWeekString(week), { command: 'poster_week', weekStart: +week })
                ]),
                [generateBackButton(BackButtonDest.POSTER)],
                [generateBackButton()],
              ]
            }
          });
        } else if (payload.type === 'genres') {
          await respond('Выберите жанр', { keyboard: genresKeyboard });
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
      } else if (payload.command === 'releases') {
        await respond('Смотри релизы тут: https://vk.com/soundcheck_ural/new_release');
      } else if (payload.command === 'services') {
        await respond('Выберите товар', { keyboard: servicesKeyboard });
      } else if (payload.command === 'service') {
        await respond('', {
          attachments: [payload.serviceId]
        });
      } else if (payload.command === 'tell_about_group') {
        await respond(`Испольхуйте хэштег ${TELL_ABOUT_GROUP_HASHTAG}`);
      } else if (payload.command === 'tell_about_release') {
        await respond(`Испольхуйте хэштег ${RELEASE_HASHTAG}`);
      } else if (payload.command === 'refresh_keyboard') {
        await respond('Клавиатура обновлена', { keyboard: mainKeyboard });
      }
    } else {
      const text = body.object.text;

      if (text.includes(TELL_ABOUT_GROUP_HASHTAG)) {
        await Promise.all([
          respond('Рассказ о группе принят'),
          sendVKMessage(TELL_ABOUT_GROUP_TARGET, 'Рассказ о группе', {
            forwardMessages: [body.object.id]
          })
        ]);
      } else if (text.includes(RELEASE_HASHTAG)) {
        await Promise.all([
          respond('Релиз принят'),
          sendVKMessage(RELEASES_TARGET, 'Релиз', {
            forwardMessages: [body.object.id]
          })
        ]);
      }
    }

    ctx.body = 'ok';
  } else {
    ctx.body = 'ok';
  }
}
