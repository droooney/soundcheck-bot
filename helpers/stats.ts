import * as _ from 'lodash';
import moment = require('moment-timezone');
import * as Sequelize from 'sequelize';

import { ButtonPayload, ClicksGroup, Genre, StatsPeriod, Subscription } from '../types';
import { captions, subscriptionNames } from '../constants';
import { getSectionsString, getSubscriptionGroups } from './common';
import { getPostLink, getUserLink } from './vk';
import DailyStats from '../database/DailyStats';
import Click from '../database/Click';
import GroupUser from '../database/GroupUser';
import Repost from '../database/Repost';

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
    { payload: { command: 'releases' }, caption: captions.releases },
    { payload: { command: 'drawings' }, caption: captions.drawings },
    { payload: { command: 'text_materials' }, caption: captions.text_materials },
    { payload: { command: 'services' }, caption: captions.services },
    { payload: { command: 'soundfest' }, caption: captions.soundfest },
    { payload: { command: 'clothes' }, caption: captions.clothes },
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
