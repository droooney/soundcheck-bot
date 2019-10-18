import * as util from 'util';
import * as http from 'http';
import Application = require('koa');
import BodyParser = require('koa-bodyparser');
import Router = require('koa-router');
import moment = require('moment-timezone');

import { refreshGoogleAccessToken } from './helpers';
import mainResponse from './mainResponse';

util.inspect.defaultOptions.depth = 10;

moment.tz.setDefault('Asia/Yekaterinburg');
moment.locale('ru-RU');

const app = new Application();
const server = http.createServer(app.callback());
const router = new Router({
  prefix: '/soundcheck-bot5778'
});

router.post('/oajhnswfa78sfnah87hbhnas9f8', mainResponse);

app.use(async (ctx, next) => {
  console.log(ctx.method, ctx.type, ctx.url);

  try {
    await next();
  } catch (e) {
    console.log(e);

    ctx.status = 500;
  }
});
app.use(BodyParser());

app.use(router.routes());
app.use(router.allowedMethods());

async function main() {
  await refreshGoogleAccessToken();

  await new Promise((resolve) => {
    server.listen(process.env.PORT || 5778, () => {
      console.log('Listening...');

      resolve();
    });
  });
}

main();
