import * as qs from 'querystring';
import axios, { AxiosResponse, Method } from 'axios';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import moment = require('moment-timezone');
import * as Sequelize from 'sequelize';
import { ExecOptions as NativeExecOptions } from 'child_process';
import { exec, Options as ExecOptions } from 'child-process-promise';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as uuid from 'uuid';
import * as stream from 'stream';

import {
  ButtonPayload,
  ClicksGroup,
  Concert,
  ConversationsResponse,
  Event,
  EventsResponse,
  File,
  FileMetadata,
  FilesResponse,
  Genre,
  GetUsersResponse,
  Keyboard,
  ManagersResponse,
  Message,
  MessageAttachment,
  Post,
  SendMessageResponse,
  Service,
  StatsPeriod,
  Subscription,
  VkUser,
  WallAttachment,
} from './types';
import { captions, services, subscriptionNames } from './constants';
import config from './config';
import VKError from './VKError';
import User from './database/User';
import Drawing from './database/Drawing';
import Click from './database/Click';
import DailyStats from './database/DailyStats';
import GroupUser from './database/GroupUser';
import Repost from './database/Repost';

const dumpDir = `${__dirname}/database/dumps`;
const versionFile = `${__dirname}/database/version`;
const {
  private_key,
  client_email,
  token_uri
} = require('./googleCredentials.json');

let googleAPIAccessToken = '';

export async function timeout(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function refreshGoogleAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const jwtToken = jwt.sign({
    iss: client_email,
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
    ].join(' '),
    aud: token_uri,
    exp: now + 3600,
    iat: now
  }, private_key, {
    algorithm: 'RS256'
  });
  const { data } = await axios.post(token_uri, qs.stringify({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwtToken
  }));

  googleAPIAccessToken = data.access_token;
}

export interface SendGoogleRequestOptions {
  url: string;
  method: Method;
  headers?: object;
  query?: object;
  data?: any;
}

export async function sendGoogleRequest<T>(options: SendGoogleRequestOptions): Promise<AxiosResponse<T>> {
  let i = 0;

  while (i++ < 5) {
    try {
      return await trySendGoogleRequest(options);
    } catch (err) {
      if (err.response.data.error && err.response.data.error.code === 401) {
        await refreshGoogleAccessToken();
      } else {
        throw err;
      }
    }
  }

  return trySendGoogleRequest(options);
}

export function trySendGoogleRequest<T>(options: SendGoogleRequestOptions): Promise<AxiosResponse<T>> {
  return axios.request({
    url: `${options.url}${options.query ? `?${qs.stringify(options.query as any)}` : ''}`,
    method: options.method,
    headers: {
      Authorization: `Bearer ${googleAPIAccessToken}`,
      ...options.headers
    },
    data: options.data,
  });
}

export async function getEvents(calendarId: string, dateStart?: moment.Moment, dateEnd?: moment.Moment): Promise<Event[]> {
  const events: Event[] = [];
  let pageToken: string | undefined;

  while (true) {
    const { data } = await sendGoogleRequest<EventsResponse>({
      url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      method: 'get',
      query: {
        maxResults: 2500,
        pageToken,
        orderBy: 'startTime',
        singleEvents: true,
        ...(dateStart ? { timeMin: dateStart.toISOString(true) } : {}),
        ...(dateEnd ? { timeMax: dateEnd.toISOString(true) } : {})
      }
    });

    if (!data.items) {
      break;
    }

    events.push(...data.items);

    if (!data.nextPageToken) {
      break;
    }

    pageToken = data.nextPageToken;
  }

  return events;
}

export async function getHolidays(dateStart: moment.Moment, dateEnd: moment.Moment): Promise<moment.Moment[]> {
  dateStart = dateStart.clone().startOf('day');
  dateEnd = dateEnd.clone().endOf('day').add(1, 'ms');

  return (await getEvents('ru.russian#holiday@group.v.calendar.google.com', dateStart, dateEnd)).map(({ start }) => moment(start.date));
}

export async function getConcerts(dateStart?: moment.Moment, dateEnd?: moment.Moment): Promise<Concert[]> {
  return (await getEvents('soundcheck.ekb@gmail.com', dateStart, dateEnd)).map(getConcertFromEvent).filter(isConcertReady);
}

export function getConcertsByDays(concerts: Concert[]): Record<string, Concert[]> {
  return _.groupBy(concerts, (concert) => +concert.startTime.clone().startOf('day'));
}

export interface VKRequestMap {
  'groups.getMembers': ManagersResponse;
  'messages.getConversations': ConversationsResponse;
  'messages.send': SendMessageResponse;
  'users.get': GetUsersResponse;
}

export async function sendVKRequest<T extends keyof VKRequestMap>(method: T, query: object = {}): Promise<VKRequestMap[T]> {
  const response = await axios.post(`https://api.vk.com/method/${method}`, qs.stringify({
    v: '5.101',
    access_token: config.vkToken,
    ...query,
  }));

  if (response.data.error) {
    throw new VKError(response.data.error);
  }

  return response.data.response;
}

export interface SendVkMessageOptions {
  keyboard?: Keyboard;
  forwardMessages?: number[];
  attachments?: MessageAttachment[];
  randomId?: number | bigint;
  lat?: number;
  long?: number;
}

export async function sendVKMessage(dest: number | number[], message: string, options: SendVkMessageOptions = {}): Promise<SendMessageResponse> {
  return await sendVKRequest('messages.send', {
    user_ids: typeof dest === 'number' ? dest : dest.join(','),
    random_id: (options.randomId || 0).toString(),
    message,
    keyboard: JSON.stringify(options.keyboard),
    forward_messages: (options.forwardMessages || []).join(','),
    attachment: (options.attachments || []).map(({ type, id }) => type + id).join(','),
    lat: options.lat,
    long: options.long
  });
}

export async function sendVKMessages(dest: number[], message: string, options?: SendVkMessageOptions): Promise<SendMessageResponse> {
  const response: SendMessageResponse = [];
  const chunks = _.chunk(dest, 100);

  for (const chunk of chunks) {
    response.push(...await sendVKMessage(chunk, message, options));

    await timeout(1000);
  }

  return response;
}

export async function sendVkMessageToSubscribedUsers(subscriptions: Subscription[], message: string, options?: SendVkMessageOptions): Promise<SendMessageResponse> {
  const subscribedUsers = (await User.findAll()).filter((user) => (
    user.subscriptions.some((subscription) => subscriptions.includes(subscription))
  ));

  return await sendVKMessages(subscribedUsers.map(({ vkId }) => vkId), message, options);
}

export async function sendVkMessageToAllConversations(message: string, options?: SendVkMessageOptions): Promise<SendMessageResponse> {
  const vkIds = await getAllConversations();

  return await sendVKMessages(vkIds, message, options);
}

export async function getAllConversations(): Promise<number[]> {
  const conversations: number[] = [];
  const count = 200;
  let offset = 0;

  while (true) {
    const { items } = await sendVKRequest('messages.getConversations', { offset, count });

    conversations.push(...items.map(({ conversation }) => conversation.peer.id));

    if (items.length < count) {
      break;
    }

    offset = conversations.length;

    await timeout(100);
  }

  return conversations;
}

export async function getVkUsers(vkIds: number[]): Promise<VkUser[]> {
  const users: VkUser[] = [];
  const count = 1000;
  let offset = 0;

  while (offset < vkIds.length) {
    users.push(
      ...await sendVKRequest('users.get', {
        user_ids: vkIds.slice(offset, offset + count).join(','),
        fields: ['sex', 'bdate'].join(',')
      })
    );

    offset += count;
  }

  return users;
}

export async function getVkUser(vkId: number): Promise<VkUser> {
  return (await getVkUsers([vkId]))[0];
}

export function getConcertFields(description?: string): Partial<Record<string, string>> {
  const fields: Partial<Record<string, string>> = {};
  let string = description || '';
  let prevKey = '';

  while (string) {
    const match = string.match(/(?:^|\n)([^:]*):/i);

    if (!match) {
      fields[prevKey] = string.trim();

      break;
    }

    fields[prevKey] = string.slice(0, match.index).trim();
    string = string.slice(match.index! + match[0].length);
    prevKey = match[1];
  }

  return fields;
}

export function getConcertFromEvent(event: Event): Concert {
  const fields = getConcertFields(event.description);

  return {
    ready: event.colorId === '2',
    title: event.summary || '',
    startTime: moment(event.start.dateTime),
    genres: (fields.Жанр || '').split(/\s*,\s*/).filter(Boolean),
    description: fields.Описание || '',
    location: (event.location || '').trim(),
    entry: fields.Вход || ''
  };
}

export function isConcertReady(concert: Concert): boolean {
  return (
    concert.ready
    && concert.startTime.isValid()
    && !!concert.title
    && !!concert.genres.length
    && !!concert.description
    && !!concert.location
    && !!concert.entry
  );
}

export async function getDailyConcerts(day: moment.Moment): Promise<Concert[]> {
  return await getConcerts(day.clone().startOf('day'), day.clone().endOf('day'));
}

export async function getWeeklyConcerts(week: moment.Moment): Promise<Concert[]> {
  return await getConcerts(week.clone().startOf('week'), week.clone().endOf('week'));
}

export function getConcertString(concert: Concert): string {
  return `🎸(${concert.genres.join(', ')}) - ${concert.title}
${concert.description}
🎯Где: ${concert.location}
Во сколько: ${concert.startTime.format('HH:mm')}
💵Вход: ${concert.entry}`;
}

export function getConcertsString(concerts: Concert[]): string {
  return concerts.map(getConcertString).join('\n\n');
}

export function getConcertsGroupString(concerts: Concert[], startTime: string): string {
  return `——————————————
📌 ${capitalizeWords(moment(+startTime).format('DD MMMM - dddd'))}
——————————————

${getConcertsString(concerts)}`;
}

export function getConcertsByDaysString(groups: Record<string, Concert[]>): string {
  return _.map(groups, getConcertsGroupString).join('\n\n');
}

export function getConcertsByDaysStrings(groups: Record<string, Concert[]>): string[] {
  const strings: string[] = [];

  _.forEach(groups, (group, startTime) => {
    const currentString = _.last(strings);
    const groupString = getConcertsGroupString(group, startTime);

    if (currentString === undefined) {
      strings.push(groupString);
    } else {
      const newString = `${currentString}\n\n${groupString}`;

      if (newString.length > 3500) {
        strings.push(groupString);
      } else {
        strings[strings.length - 1] = newString;
      }
    }
  });

  return strings;
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

export function getPostId(message: Message): string | null {
  const wallAttachment = message.attachments.find(({ type }) => type === 'wall') as WallAttachment | undefined;

  if (wallAttachment) {
    return `${wallAttachment.wall.to_id}_${wallAttachment.wall.id}`;
  }

  try {
    const url = new URL(message.text);

    if (url.protocol !== 'https:' && url.hostname !== 'vk.com') {
      return null;
    }

    const pathMatch = url.pathname.match(/^\/wall(-?\d+_\d+)$/);

    if (pathMatch) {
      return pathMatch[1];
    }

    const wallQuery = url.searchParams.get('w');

    if (!wallQuery) {
      return null;
    }

    const wallMatch = wallQuery.match(/^wall(-?\d+_\d+)$/);

    return wallMatch && wallMatch[1];
  } catch (err) {
    return null;
  }
}

export function getRepostPostId(post: Post): string | null {
  if (!post.copy_history) {
    return post.owner_id === -config.soundcheckId
      ? `${post.owner_id}_${post.id}`
      : null;
  }

  for (const historyPost of post.copy_history) {
    const postId = getRepostPostId(historyPost);

    if (postId) {
      return postId;
    }
  }

  return null;
}

export function getUserLink(userId: number): string {
  return `https://vk.com/id${userId}`;
}

export function getPostLink(postId: string): string {
  return `https://vk.com/wall${postId}`;
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

export function getStatsPeriodBounds(period: StatsPeriod): { start: moment.Moment; end: moment.Moment; } {
  const start = moment();
  const end = start.clone();

  if (period === 'today') {
    start.startOf('day');
    end.endOf('day');
  } else if (period === 'yesterday') {
    start.subtract(1, 'day').startOf('day');
    end.subtract(1, 'day').endOf('day');
  } else if (period === 'this_week') {
    start.startOf('week');
    end.endOf('week');
  } else if (period === 'prev_week') {
    start.subtract(1, 'week').startOf('week');
    end.subtract(1, 'week').endOf('week');
  } else if (period === 'this_month') {
    start.startOf('month');
    end.endOf('month');
  } else if (period === 'prev_month') {
    start.subtract(1, 'month').startOf('month');
    end.subtract(1, 'month').endOf('month');
  } else if (period === 'all_time') {
    start.subtract(+start, 'ms');
  }

  return { start, end };
}

export function getStatsPeriodWhere(period: StatsPeriod, columnName: 'createdAt' | 'date'): Sequelize.WhereAttributeHash {
  if (period === 'all_time') {
    return {};
  }

  const { start, end } = getStatsPeriodBounds(period);

  return {
    [columnName]: {
      [Sequelize.Op.gte]: start.toDate(),
      [Sequelize.Op.lte]: end.toDate(),
    }
  };
}

export async function getSubscriptionStats(period: StatsPeriod): Promise<string> {
  if (period === 'all_time') {
    return _.map(
      await getSubscriptionGroups(),
      (count, subscription: Subscription) => `${subscriptionNames[subscription]}: ${count}`
    ).join('\n');
  }

  const periodBounds = getStatsPeriodBounds(period);
  const periodStart = {
    start: periodBounds.start.clone().subtract(1, 'day').startOf('day'),
    end: periodBounds.start.clone().subtract(1, 'day').endOf('day')
  };
  const periodEnd = {
    start: periodBounds.end.clone().startOf('day'),
    end: periodBounds.end.clone().endOf('day')
  };
  const [dailyStatsPeriodStart, dailyStatsPeriodEnd] = await Promise.all([
    DailyStats.findOne({
      where: {
        date: {
          [Sequelize.Op.gte]: periodStart.start.toDate(),
          [Sequelize.Op.lte]: periodStart.end.toDate()
        }
      }
    }),
    DailyStats.findOne({
      where: {
        date: {
          [Sequelize.Op.gte]: periodEnd.start.toDate(),
          [Sequelize.Op.lte]: periodEnd.end.toDate()
        }
      }
    })
  ]);
  const subscriptionsPeriodStart = dailyStatsPeriodStart
    ? dailyStatsPeriodStart.subscriptions
    : _.mapValues(Subscription, () => 0);
  const subscriptionsPeriodEnd = dailyStatsPeriodEnd
    ? dailyStatsPeriodEnd.subscriptions
    : period === 'today' || period === 'this_week' || period === 'this_month'
      ? await getSubscriptionGroups()
      : subscriptionsPeriodStart;

  return _.map(Subscription, (subscription) => {
    const diff = (subscriptionsPeriodEnd[subscription] || 0) - (subscriptionsPeriodStart[subscription] || 0);

    return `${subscriptionNames[subscription]}: ${diff > 0 ? '+' : ''}${diff}`;
  }).join('\n');
}

export function getClickGroups(clicks: Click[]): ClicksGroup[] {
  const clickGroups: ClicksGroup[] = [];

  clicks.forEach((click) => {
    const payload: Partial<ButtonPayload> = click.payload.command === 'poster/type/day'
      ? { command: 'poster/type/day' }
      : click.payload.command === 'poster/type/week'
        ? { command: 'poster/type/week' }
        : click.payload;
    const group = clickGroups.find((clicksGroup) => _.isEqual(clicksGroup.payload, payload));

    if (group) {
      group.count++;
    } else {
      clickGroups.push({ payload, count: 1 });
    }
  });

  return clickGroups;
}

export function mergeClickGroups(clickGroups: ClicksGroup[][]): ClicksGroup[] {
  const groups: ClicksGroup[] = [];

  clickGroups.forEach((clickGroups) => {
    clickGroups.forEach((clicksGroup) => {
      const group = groups.find(({ payload }) => _.isEqual(clicksGroup.payload, payload));

      if (group) {
        group.count += clicksGroup.count;
      } else {
        groups.push(clicksGroup);
      }
    });
  });

  return groups;
}

export async function getClickStats(period: StatsPeriod): Promise<string> {
  let clickGroups: ClicksGroup[];

  if (period === 'today' || period === 'yesterday' || period === 'this_week') {
    clickGroups = getClickGroups(
      await Click.findAll({
        where: getStatsPeriodWhere(period, 'createdAt')
      })
    );
  } else {
    const today = moment();
    const yesterday = today.clone().subtract(1, 'day').startOf('day');
    const dailyClicks = await DailyStats.findAll({
      where: getStatsPeriodWhere(period, 'date')
    });

    clickGroups = mergeClickGroups(dailyClicks.map(({ clickGroups }) => clickGroups));

    if (
      (period === 'all_time' || period === 'this_month' || (period === 'prev_week' && !yesterday.isSame(today, 'week')))
      && dailyClicks.every(({ date }) => !yesterday.isSame(date, 'day'))
    ) {
      clickGroups = mergeClickGroups([
        clickGroups,
        getClickGroups(
          await Click.findAll({
            where: getStatsPeriodWhere('yesterday', 'createdAt')
          })
        )
      ]);
    }

    if (period === 'all_time' || period === 'this_month') {
      clickGroups = mergeClickGroups([
        clickGroups,
        getClickGroups(
          await Click.findAll({
            where: getStatsPeriodWhere('today', 'createdAt')
          })
        )
      ]);
    }
  }

  const allClicks = clickGroups.reduce((count, clicksGroup) => count + clicksGroup.count, 0);

  if (!allClicks) {
    return captions.no_clicks;
  }

  const drawings = await Drawing.findAll();
  const buttonStats: ({ payload: Partial<ButtonPayload> | 'all'; caption: string; } | null)[] = [
    { payload: 'all', caption: captions.clicks_all },
    null,
    { payload: { command: 'poster' }, caption: captions.poster },
    { payload: { command: 'poster/type', type: 'day' }, caption: captions.poster_day },
    { payload: { command: 'poster/type/day' }, caption: captions.poster_choose_day },
    { payload: { command: 'poster/type', type: 'week' }, caption: captions.poster_week },
    { payload: { command: 'poster/type/week' }, caption: captions.poster_choose_week },
    { payload: { command: 'poster/type', type: 'genres' }, caption: captions.poster_genre },
    ..._.map(Genre, (genre) => (
      { payload: { command: 'poster/type/genre' as 'poster/type/genre', genre }, caption: captions.poster_genre_type(genre) }
    )),
    null,
    { payload: { command: 'playlists' }, caption: captions.playlists },
    { payload: { command: 'playlists/all' }, caption: `${captions.playlists} (${captions.playlists_all})` },
    { payload: { command: 'playlists/thematic' }, caption: `${captions.playlists} (${captions.playlists_thematic})` },
    { payload: { command: 'playlists/genre' }, caption: `${captions.playlists} (${captions.playlists_genre})` },
    null,
    { payload: { command: 'releases' }, caption: captions.releases },
    null,
    { payload: { command: 'drawings' }, caption: captions.drawings },
    ...drawings.map((drawing) => (
      { payload: { command: 'drawings/drawing' as 'drawings/drawing', drawingId: drawing.id }, caption: `${captions.drawing} (${drawing.name})` }
    )),
    null,
    { payload: { command: 'text_materials' }, caption: captions.text_materials },
    { payload: { command: 'text_materials/longread' }, caption: captions.longreads },
    { payload: { command: 'text_materials/group_history' }, caption: captions.group_history },
    null,
    { payload: { command: 'audio_materials' }, caption: captions.audio_materials },
    { payload: { command: 'audio_materials/digests' }, caption: captions.digests },
    null,
    { payload: { command: 'services' }, caption: captions.services },
    ..._.map(services, ({ name }, service) => (
      { payload: { command: 'services/service' as 'services/service', service: service as Service }, caption: `${captions.services} (${name})` }
    )),
  ];

  return buttonStats
    .map((button) => {
      if (!button) {
        return '';
      }

      const { payload, caption } = button;

      if (payload === 'all') {
        return `${caption}: ${allClicks}`;
      }

      const clicksGroup = _.find(clickGroups, (clicksGroup) => _.isEqual(clicksGroup.payload, payload));
      const count = clicksGroup ? clicksGroup.count : 0;

      return `${caption}: ${count} (${+((count / allClicks) * 100).toFixed(2)}%)`;
    })
    .join('\n');
}

export async function getGroupStats(period: StatsPeriod): Promise<string> {
  const groupUsers = await GroupUser.findAll({
    where: getStatsPeriodWhere(period, 'createdAt')
  });
  const userStartStatuses: Record<number, boolean> = {};
  const userEndStatuses: Record<number, boolean> = {};
  const joinedUsers: number[] = [];
  const leftUsers: number[] = [];

  groupUsers.forEach(({ vkId, status }) => {
    if (!(vkId in userStartStatuses)) {
      userStartStatuses[vkId] = status;
    }

    userEndStatuses[vkId] = status;
  });

  _.forEach(userEndStatuses, (status, vkId) => {
    const startStatus = userStartStatuses[+vkId];

    if (startStatus === status) {
      if (status) {
        joinedUsers.push(+vkId);
      } else {
        leftUsers.push(+vkId);
      }
    }
  });

  return getSectionsString([
    {
      header: captions.users_joined(joinedUsers.length),
      rows: joinedUsers.map(getUserLink)
    },
    {
      header: captions.users_left(leftUsers.length),
      rows: leftUsers.map(getUserLink)
    },
  ]);
}

export async function getRepostStats(period: StatsPeriod): Promise<string> {
  const allReposts = await Repost.findAll({
    where: getStatsPeriodWhere(period, 'createdAt')
  });

  if (!allReposts.length) {
    return captions.no_reposts;
  }

  const groups = _.groupBy(allReposts, 'originalPostId');

  return getSectionsString(
    _.map(groups, (reposts, postId) => ({
      header: `Пост: ${getPostLink(postId)}`,
      rows: reposts.map(({ ownerId, postId }) => getPostLink(`${ownerId}_${postId}`))
    }))
  );
}

export async function getAllStats(period: StatsPeriod): Promise<string> {
  const [subscriptionStats, groupStats, repostStats] = await Promise.all([
    getSubscriptionStats(period),
    getGroupStats(period),
    getRepostStats(period),
  ]);

  return getSectionsString([
    { header: captions.subscriptions, rows: [subscriptionStats] },
    { header: captions.group, rows: [groupStats] },
    { header: captions.reposts, rows: [repostStats] },
  ].map(({ header, rows }) => ({ header: `——————————————\n${header.toUpperCase()}\n——————————————\n`, rows })));
}

export async function createDbDump(): Promise<string> {
  const currentVersion = +await fs.readFile(versionFile, 'utf8');
  const { username, host, database } = config.dbConnection;
  const filename = `${dumpDir}/db_dump-v${currentVersion}-${moment().format('YYYY-MM-DDTHH-mm')}.sql`;
  const command = `pg_dump -U ${username} -h ${host} ${database} > ${filename}`;

  await executeCommand(command, { cwd: process.cwd() });

  return filename;
}

export async function getAllGoogleDriveFiles(): Promise<File[]> {
  const {
    data: {
      files
    }
  } = await sendGoogleRequest<FilesResponse>({
    url: 'https://www.googleapis.com/drive/v3/files',
    method: 'get',
    query: {
      pageSize: 1000
    }
  });

  return Promise.all(
    files.map(async ({ id }) => (
      (await sendGoogleRequest<File>({
        url: `https://www.googleapis.com/drive/v3/files/${id}`,
        method: 'get',
        query: {
          fields: 'kind, id, name, mimeType, shared, parents'
        }
      })).data
    ))
  );
}

export async function uploadFile(filename: string, mimeType: string, parentFolder?: string) {
  const metadata: FileMetadata = {
    mimeType,
    name: path.basename(filename)
  };

  if (parentFolder) {
    metadata.parents = [parentFolder];
  }

  const multipart: [{ contentType: string; body: string; }, { contentType: string; body: stream.Readable; }] = [
    { contentType: 'application/json', body: JSON.stringify(metadata) },
    { contentType: mimeType, body: fs.createReadStream(filename) },
  ];
  const boundary = uuid.v4();
  const finale = `--${boundary}--`;
  const rStream = new stream.PassThrough({
    flush(callback) {
      this.push('\r\n');
      this.push(finale);
      callback();
    }
  });

  for (const part of multipart) {
    const preamble = `--${boundary}\r\nContent-Type: ${part.contentType}\r\n\r\n`;

    rStream.push(preamble);

    if (typeof part.body === 'string') {
      rStream.push(part.body);
      rStream.push('\r\n');
    } else {
      part.body.pipe(rStream);
    }
  }

  await sendGoogleRequest({
    url: 'https://www.googleapis.com/upload/drive/v3/files',
    method: 'post',
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    query: {
      uploadType: 'multipart'
    },
    data: rStream
  });
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

export function createEverydayDaemon(time: string, daemon: () => void) {
  const daemonFunc = async () => {
    try {
      console.log(`starting daemon ${daemon.name} at ${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}`);

      await daemon();

      console.log(`daemon ${daemon.name} finished successfully at ${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}`);
    } catch (err) {
      console.log(`daemon ${daemon.name} error`, err);
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

export async function sendPosterMessage() {
  const posterDay = moment()
    .add(1, 'day')
    .startOf('day')
    .hours(12);
  const posterText = await getPosterText(posterDay);

  if (posterText) {
    await sendVKMessage(config.targets.poster, `Афиша на ${
      posterDay.weekday() === 0 ? getWeekString(posterDay) : getDayString(posterDay)
    }: https://all-chess.org/soundcheck-bot${config.port}/api/concerts?date=${posterDay.format('YYYY-MM-DD')}`);
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
  await Click.destroy({
    where: {
      createdAt: {
        [Sequelize.Op.lt]: moment().subtract(6, 'months').startOf('day').toDate()
      }
    }
  });
}

export async function rotateDbDumps() {
  const filename = await createDbDump();
  const allFiles = await getAllGoogleDriveFiles();
  const dumpsFolder = allFiles.find(({ name }) => name === config.googleDriveDumpsFolderName);

  if (dumpsFolder) {
    try {
      await uploadFile(filename, 'application/x-sql', dumpsFolder.id);
    } catch (err) {
      console.log('upload file error', err);
    }
  } else {
    console.warn('warning: no dumps folder found');
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

  await Promise.all(
    files.map(async (file) => {
      if (file.mimeType === 'application/x-sql' && (!file.parents || !file.shared)) {
        await sendGoogleRequest({
          url: `https://www.googleapis.com/drive/v3/files/${file.id}`,
          method: 'delete'
        });

        console.log(`dump ${file.name} deleted`);
      }
    })
  );
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
