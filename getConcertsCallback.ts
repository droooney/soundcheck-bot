import { Context } from 'koa';
import moment = require('moment-timezone');

import {
  getPosterText
} from './helpers';

export default async (ctx: Context) => {
  const {
    date
  } = ctx.query;

  ctx.body = await getPosterText(moment(date)) || 'Недостаточно концертов';
};
