import * as http from 'http';
import Application = require('koa');
import BodyParser = require('koa-bodyparser');
import Router = require('koa-router');
import moment = require('moment-timezone');

import {
  createEverydayDaemon,
  createRepeatingTask,
  deactivateExpiredDrawings,
  getManagers,
  notifyUsersAboutSoonToExpireDrawing,
  refreshGoogleAccessToken,
  refreshOnlineStatus,
  refreshUsersInfo,
  removeUnusedDumpsInDrive,
  rotateClicks,
  rotateDbDumps,
  saveDailyStats,
  sendClickStatsMessage,
  sendPosterMessage,
  sendStatsMessage,
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
  const [fetchedManagers] = await Promise.all([
    getManagers(),
    refreshGoogleAccessToken(),
    migrate()
  ]);

  managers = fetchedManagers;

  await new Promise((resolve) => {
    server.listen(config.port, () => {
      Logger.log('Listening...');

      resolve();
    });
  });

  createEverydayDaemon('00:01:00', saveDailyStats);
  createEverydayDaemon('00:05:00', deactivateExpiredDrawings);
  createEverydayDaemon('01:00:00', sendClickStatsMessage);
  createEverydayDaemon('05:00:00', sendStatsMessage);
  createEverydayDaemon('05:10:00', rotateClicks);
  createEverydayDaemon('05:15:00', refreshUsersInfo);
  createEverydayDaemon('05:30:00', rotateDbDumps);
  createEverydayDaemon('06:00:00', removeUnusedDumpsInDrive);
  createEverydayDaemon('15:00:00', sendPosterMessage);
  createEverydayDaemon('15:00:00', notifyUsersAboutSoonToExpireDrawing);

  createRepeatingTask(5 * 60 * 1000, refreshOnlineStatus);
}

(async () => {
  try {
    await main();
  } catch (e) {
    Logger.error(e, 'init error');

    process.exit(1);
  }
})();
