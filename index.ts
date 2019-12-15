import * as http from 'http';
import Application = require('koa');
import BodyParser = require('koa-bodyparser');
import Router = require('koa-router');
import moment = require('moment-timezone');

import {
  createEverydayDaemon,
  deactivateExpiredDrawings,
  notifyUsersAboutSoonToExpireDrawing,
  refreshGoogleAccessToken,
  refreshUsersInfo,
  removeUnusedDumpsInDrive,
  rotateClicks,
  rotateDbDumps,
  saveDailyStats,
  sendClickStatsMessage,
  sendPosterMessage,
  sendStatsMessage,
  sendVKRequest,
} from './helpers';
import vkBotCallback from './vkBotCallback';
import getConcertsCallback from './getConcertsCallback';
import config from './config';
import { migrate } from './database';
import Logger from './Logger';

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
  Logger.log(ctx.method, ctx.type, ctx.url);

  ctx.managers = managers;
  ctx.changeManagers = (newManagers) => {
    Logger.log('old managers', managers);
    Logger.log('new managers', newManagers);

    managers = newManagers;
  };

  try {
    await next();
  } catch (e) {
    Logger.error(e, 'failed at bot endpoint');

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

  await new Promise((resolve) => {
    server.listen(config.port, () => {
      Logger.log('Listening...');

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
  createEverydayDaemon('00:05:00', deactivateExpiredDrawings);
  createEverydayDaemon('15:00:00', notifyUsersAboutSoonToExpireDrawing);
  createEverydayDaemon('05:15:00', refreshUsersInfo);
}

(async () => {
  try {
    await main();
  } catch (e) {
    Logger.error(e, 'init error');

    process.exit(1);
  }
})();
