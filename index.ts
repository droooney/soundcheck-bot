import * as util from 'util';
import * as http from 'http';
import Application = require('koa');
import BodyParser = require('koa-bodyparser');
import Router = require('koa-router');
import moment = require('moment-timezone');
import * as _ from 'lodash';

import Database from './Database';
import { refreshGoogleAccessToken, sendNextPosterMessage, sendVKMessage, sendVKRequest } from './helpers';
import vkBotCallback from './vkBotCallback';
import getConcertsCallback from './getConcertsCallback';
import { ConversationsResponse } from './types';

util.inspect.defaultOptions.depth = 10;

moment.tz.setDefault('Asia/Yekaterinburg');
moment.locale('ru-RU');

const app = new Application();
const server = http.createServer(app.callback());
const router = new Router({
  prefix: '/soundcheck-bot5778'
});

router.get('/api/concerts', getConcertsCallback);
router.post('/9lyvg7xn27axayu5ybpy3o1og67', vkBotCallback);

app.use(async (ctx, next) => {
  console.log(ctx.method, ctx.type, ctx.url);

  try {
    await next();
  } catch (e) {
    if (e.isAxiosError) {
      console.log(e.response.status, e.response.data);
    } else {
      console.log(e);
    }

    ctx.status = 500;
  }
});
app.use(BodyParser());

app.use(router.routes());
app.use(router.allowedMethods());

async function main() {
  await Promise.all([
    refreshGoogleAccessToken(),
    Database.prepare()
  ]);

  const {
    data: {
      response: {
        items: conversations
      }
    }
  } = await sendVKRequest<ConversationsResponse>('messages.getConversations', { count: 200 });
  const userIds = conversations.map(({ conversation }) => conversation.peer.id);

  if (false) {
    const chunks = _.chunk(userIds, 50);

    for (const chunk of chunks) {
      await sendVKMessage(chunk.join(','), 'test');
    }
  }

  await new Promise((resolve) => {
    server.listen(process.env.PORT || 5778, () => {
      console.log('Listening...');

      resolve();
    });
  });

  sendNextPosterMessage();
}

main();
