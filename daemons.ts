import * as fs from 'fs-extra';
import * as _ from 'lodash';
import moment = require('moment-timezone');
import * as Sequelize from 'sequelize';

import { Subscription } from './types';
import { captions, dumpDir } from './constants';
import {
  createDbDump,
  getAllGoogleDriveFiles,
  getAllStats,
  getClickGroups,
  getClickStats,
  getDayString,
  getPosterText,
  getSortedFiles,
  getStatsPeriodWhere,
  getSubscriptionGroups,
  getVkUsers,
  getWeekString,
  removeFile,
  sendVKMessage,
  sendVKMessages,
  sendVKRequest,
  timeout,
  uploadFile,
} from './helpers';
import Logger from './Logger';
import config from './config';
import Click from './database/Click';
import DailyStats from './database/DailyStats';
import Drawing from './database/Drawing';
import Repost from './database/Repost';
import User from './database/User';

export function createEverydayDaemon(time: string, daemon: () => void) {
  const daemonFunc = async () => {
    try {
      Logger.log(`daemon "${daemon.name}" started`);

      await daemon();

      Logger.log(`daemon "${daemon.name}" finished successfully`);
    } catch (err) {
      Logger.error(err, `daemon "${daemon.name}" failed`);
    }
  };
  const timeMoment = moment(time, 'HH:mm:ss');
  const ms = +timeMoment - +timeMoment.clone().startOf('day');
  const now = moment();
  const nextDaemonRunTime = now
    .clone()
    .startOf('day')
    .add(ms, 'ms');

  if (now.isSameOrAfter(nextDaemonRunTime)) {
    nextDaemonRunTime.add(1, 'day');
  }

  setTimeout(() => {
    daemonFunc();

    setInterval(daemonFunc, 24 * 60 * 60 * 1000);
  }, +nextDaemonRunTime - +now);
}

export function createRepeatingTask(ms: number, task: () => void) {
  const taskFunc = async () => {
    try {
      Logger.log(`repeating task "${task.name}" started`);

      await task();

      Logger.log(`repeating task "${task.name}" finished successfully`);
    } catch (err) {
      Logger.error(err, `repeating task "${task.name}" failed`);
    }
  };

  taskFunc();

  setInterval(taskFunc, ms);
}

export async function sendPosterMessage() {
  const posterDay = moment()
    .add(1, 'day')
    .startOf('day')
    .hours(12);
  const posterText = await getPosterText(posterDay);

  if (posterText) {
    await sendVKMessage(config.targets.poster, `Афиша на ${
      posterDay.weekday() === 0 ? getWeekString(posterDay) : getDayString(posterDay)
    }: https://tion.icu/soundcheck-bot${config.port}/api/concerts?date=${posterDay.format('YYYY-MM-DD')}`);
  }
}

export async function sendStatsMessage() {
  await sendVKMessage(config.targets.stats, await getAllStats('yesterday'));
}

export async function sendClickStatsMessage() {
  if (moment().weekday() === 0) {
    await sendVKMessage(config.targets.stats, await getClickStats('prev_week'));
  }
}

export async function saveDailyStats() {
  const yesterday = moment().subtract(1, 'day').startOf('day');
  const [yesterdayClicks, subscriptions] = await Promise.all([
    await Click.findAll({
      where: getStatsPeriodWhere('yesterday', 'createdAt')
    }),
    await getSubscriptionGroups()
  ]);
  const userClicks = _.mapValues(_.groupBy(yesterdayClicks, 'vkId'), (clicks) => clicks.length);

  await DailyStats.add({
    date: yesterday.toDate(),
    clickGroups: getClickGroups(yesterdayClicks),
    userClicks,
    subscriptions
  });
}

export async function rotateClicks() {
  // await Click.destroy({
  //   where: {
  //     createdAt: {
  //       [Sequelize.Op.lt]: moment().subtract(6, 'months').startOf('day').toDate()
  //     }
  //   }
  // });
}

export async function rotateDbDumps() {
  const filename = await createDbDump();
  const allFiles = await getAllGoogleDriveFiles();
  const dumpsFolder = allFiles.find(({ name }) => name === config.googleDriveDumpsFolderName);

  if (dumpsFolder) {
    try {
      await uploadFile(filename, 'application/x-sql', dumpsFolder.id);
    } catch (err) {
      Logger.error(err, 'upload file error');
    }
  } else {
    Logger.warn('warning: no dumps folder found');
  }

  const DUMPS_TO_KEEP = 7;

  await Promise.all(
    (await getSortedFiles(dumpDir))
      .slice(DUMPS_TO_KEEP)
      .map((dump) => fs.unlink(dump))
  );
}

export async function removeUnusedDumpsInDrive() {
  const files = await getAllGoogleDriveFiles();

  for (const file of files) {
    if (file.mimeType === 'application/x-sql' && (!file.parents || !file.shared)) {
      await removeFile(file);

      Logger.log(`dump ${file.name} deleted`);
    }

    await timeout(5000);
  }
}

export async function deactivateExpiredDrawings() {
  const now = moment();
  const drawings = await Drawing.getActiveDrawings();

  await Promise.all(
    drawings.map(async (drawing) => {
      if (moment(drawing.expiresAt).isBefore(now)) {
        drawing.active = false;

        await drawing.save();
      }
    })
  );
}

export async function notifyUsersAboutSoonToExpireDrawing() {
  const tomorrow = moment().add(1, 'day');
  const soonToExpireDrawing = await Drawing.findOne({
    where: {
      active: true,
      expiresAt: {
        [Sequelize.Op.lt]: tomorrow.toDate()
      }
    }
  });

  if (!soonToExpireDrawing) {
    return;
  }

  const [reposts, users] = await Promise.all([
    Repost.findAll({
      where: {
        originalPostId: soonToExpireDrawing.postId
      }
    }),
    User.findAll()
  ]);
  const usersToSendMessage = users.filter((user) => (
    user.subscriptions.includes(Subscription.DRAWINGS)
    && reposts.every(({ ownerId }) => ownerId !== user.vkId)
  ));

  await sendVKMessages(usersToSendMessage.map(({ vkId }) => vkId), captions.drawing_soon_expires(soonToExpireDrawing), {
    attachments: [{ type: 'wall', id: soonToExpireDrawing.postId }]
  });
}

export async function refreshUsersInfo() {
  const users = await User.findAll();
  const vkUsersData = await getVkUsers(users.map(({ vkId }) => vkId));

  await Promise.all(
    users.map(async (user, index) => {
      Object.assign(user, User.getVkUserData(vkUsersData[index]));

      if (user.changed()) {
        await user.save();
      }
    })
  );
}

export async function refreshOnlineStatus() {
  const { status } = await sendVKRequest('groups.getOnlineStatus', { group_id: config.soundcheckId });

  if (status === 'none') {
    await sendVKRequest('groups.enableOnline', { group_id: config.soundcheckId })
  }
}
