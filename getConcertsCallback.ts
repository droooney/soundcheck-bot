import { Context } from 'koa';
import moment = require('moment-timezone');

import {
  getPosterText
} from './helpers';

export default async (ctx: Context) => {
  const {
    date
  } = ctx.query;
  const posterText = await getPosterText(moment(date));

  ctx.body = posterText
    ? `${posterText.replace(new RegExp('—'.repeat(10), 'g'), '—'.repeat(14))}\n\nОставайся с Soundcheck – Музыка Екатеринбурга, \
чтобы не пропустить свежие новости, и, конечно, рассказывай друзьям – им точно будет интереcно!`
    : 'Недостаточно концертов';
};
