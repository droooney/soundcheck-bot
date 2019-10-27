import { Context } from 'koa';
import moment = require('moment-timezone');

import {
  getConcertsByDays,
  getConcertsByDaysString,
  getDailyConcerts,
  getWeeklyConcerts,
  getWeekString
} from './helpers';

export default async (ctx: Context) => {
  const {
    date,
    period
  } = ctx.query;
  const day = moment(date);
  let posterText = 'Недостаточно концертов';

  if (period === 'week') {
    const concerts = await getWeeklyConcerts(day);

    if (concerts.length) {
      const groups = getConcertsByDays(concerts);

      posterText = `🥃 Афиша выступлений местных музыкантов на ${getWeekString(day)} от @soundcheck_ural (Soundcheck – Музыка Екатеринбурга).

${getConcertsByDaysString(groups)}`;
    }
  } else {
    const concerts = await getDailyConcerts(day);

    if (concerts.length) {
      posterText = `🥃 Афиша выступлений местных музыкантов на ${day.format('DD MMM')} от @soundcheck_ural (Soundcheck – Музыка Екатеринбурга).`;
    }
  }

  ctx.body = posterText;
};
