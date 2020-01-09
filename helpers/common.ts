import { ExecOptions as NativeExecOptions } from 'child_process';
import { exec, Options as ExecOptions } from 'child-process-promise';
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import moment = require('moment-timezone');
import * as path from 'path';

import {
  getConcertsByDays,
  getConcertsByDaysString,
  getConcertsString,
  getDailyConcerts,
  getWeeklyConcerts
} from './concerts';
import { Subscription } from '../types';
import User from '../database/User';

export async function timeout(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function capitalizeWords(string: string): string {
  return string.split(' ').map(_.capitalize).join(' ');
}

export function getWeekString(week: moment.Moment): string {
  const endOfWeek = week.clone().endOf('week');

  return capitalizeWords(
    endOfWeek.isSame(week, 'month')
      ? `${week.format('DD')}-${endOfWeek.format('DD MMMM')}`
      : `${week.format('DD MMMM')} - ${endOfWeek.format('D MMMM')}`
  );
}

export function getDayString(day: moment.Moment): string {
  return capitalizeWords(day.format('D MMMM'));
}

export function getShortDayString(day: moment.Moment): string {
  return capitalizeWords(day.format('D MMM'));
}

export async function getPosterText(posterTime: moment.Moment): Promise<string | null> {
  const isWeekly = posterTime.weekday() === 0;
  const posterHeader = `🥃 Афиша выступлений местных музыкантов на ${
    isWeekly ? getWeekString(posterTime) : getDayString(posterTime)
  } от @soundcheck_ural (Soundcheck – Музыка Екатеринбурга).`;
  let posterText: string | null = null;

  if (isWeekly) {
    const concerts = await getWeeklyConcerts(posterTime);

    if (concerts.length) {
      const groups = getConcertsByDays(concerts);

      posterText = `${posterHeader}\n\n${getConcertsByDaysString(groups)}`;
    }
  } else {
    const concerts = await getDailyConcerts(posterTime);

    if (concerts.length > 1) {
      posterText = `${posterHeader}\n\n${getConcertsString(concerts)}`;
    }
  }

  return posterText;
}

export function getSectionsString(sections: { header: string; rows: string[]; }[]): string {
  return sections.map(({ header, rows }) => [header, ...rows].join('\n')).join('\n\n');
}

export async function getSubscriptionGroups(): Promise<Record<Subscription, number>> {
  const users = await User.findAll();

  return _.mapValues(Subscription, (subscription) => (
    users.filter((user) => user.subscriptions.includes(subscription)).length
  ));
}

export async function executeCommand(command: string, options?: NativeExecOptions & ExecOptions) {
  try {
    return (await exec(command, options)).stdout;
  } catch (err) {
    throw new Error(err.stderr);
  }
}

export async function getSortedFiles(dir: string) {
  const files = await fs.readdir(dir);

  return (await Promise.all(files.map((file) => fs.stat(path.join(dir, file)))))
    .map((stat, ix) => ({ stat, ix }))
    .sort(({ stat: { birthtimeMs: b1 } }, { stat: { birthtimeMs: b2 } }) => b2 - b1)
    .map(({ ix }) => path.join(dir, files[ix]));
}

export function generateRandomCaption<T>(captions: string[]): string;
export function generateRandomCaption<T>(captions: (string | ((options: T) => string))[], options: T): string;
export function generateRandomCaption<T>(captions: (string | ((options: T) => string))[], options?: T): string {
  const caption = captions[Math.floor(Math.random() * captions.length)];

  return typeof caption === 'function'
    ? caption(options!)
    : caption || '';
}

export function isNumbersArray(array: unknown[]): array is number[] {
  return array.every((value) => typeof value === 'number');
}
