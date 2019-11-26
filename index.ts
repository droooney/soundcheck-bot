import * as http from 'http';
import Application = require('koa');
import BodyParser = require('koa-bodyparser');
import Router = require('koa-router');
import moment = require('moment-timezone');

import {
  createEverydayDaemon,
  getAllConversations,
  refreshGoogleAccessToken,
  removeUnusedDumpsInDrive,
  rotateClicks,
  rotateDbDumps,
  saveDailyStats,
  sendClickStatsMessage,
  sendPosterMessage,
  sendStatsMessage,
  sendVKMessages,
  sendVKRequest,
} from './helpers';
import vkBotCallback from './vkBotCallback';
import getConcertsCallback from './getConcertsCallback';
import { generateMainKeyboard } from './keyboards';
import config from './config';
import { migrate } from './database';
import VKError from './VKError';

declare module 'koa' {
  interface BaseContext {
    managers: number[];
    changeManagers(managers: number[]): void;
  }

  interface Context {
    managers: number[];
    changeManagers(managers: number[]): void;
  }
}

moment.tz.setDefault('Asia/Yekaterinburg');
moment.locale('ru-RU');

const app = new Application();
const server = http.createServer(app.callback());
const router = new Router({
  prefix: `/soundcheck-bot${config.port}`
});
let managers: number[] = [];

router.get('/api/concerts', getConcertsCallback);
router.post(config.endpoint, vkBotCallback);

app.use(async (ctx, next) => {
  console.log(ctx.method, ctx.type, ctx.url);

  ctx.managers = managers;
  ctx.changeManagers = (newManagers) => {
    console.log('old managers', managers);
    console.log('new managers', newManagers);

    managers = newManagers;
  };

  try {
    await next();
  } catch (e) {
    if (e.isAxiosError) {
      console.log('request error', e.response.status, e.response.data);
    } else if (e instanceof VKError) {
      console.log('vk error', e.vkError);
    } else {
      console.log('error', e);
    }

    ctx.status = 500;
  }
});
app.use(BodyParser());

app.use(router.routes());
app.use(router.allowedMethods());

async function main() {
  const [{ items }] = await Promise.all([
    sendVKRequest('groups.getMembers', {
      group_id: config.soundcheckId,
      filter: 'managers'
    }),
    refreshGoogleAccessToken(),
    migrate()
  ]);

  managers = items.map(({ id }) => id);

  if (false) {
    const userIds = await getAllConversations();

    console.log(
      await sendVKMessages(userIds, 'test unique', {
        keyboard: generateMainKeyboard(false),
        randomId: 2n ** 30n + 2n ** 29n,
      })
    );
  }

  await new Promise((resolve) => {
    server.listen(config.port, () => {
      console.log('Listening...');

      resolve();
    });
  });

  createEverydayDaemon('23:00:00', sendPosterMessage);
  createEverydayDaemon('05:00:00', sendStatsMessage);
  createEverydayDaemon('05:10:00', rotateClicks);
  createEverydayDaemon('00:01:00', saveDailyStats);
  createEverydayDaemon('01:00:00', sendClickStatsMessage);
  createEverydayDaemon('05:30:00', rotateDbDumps);
  createEverydayDaemon('06:00:00', removeUnusedDumpsInDrive);
}

(async () => {
  try {
    await main();
  } catch (e) {
    console.log('init error', e);

    process.exit(1);
  }
})();
