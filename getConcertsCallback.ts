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
    ? posterText.replace(new RegExp('—'.repeat(10), 'g'), '—'.repeat(14))
    : 'Недостаточно концертов';
};
