import * as fs from 'fs-extra';
import moment = require('moment-timezone');

import { DailyStats, Drawing, DrawingParams, ManagersResponse, Subscription, SubscriptionPost, User } from './types';
import { sendVKRequest } from './helpers';
import config from './config';

export type Preparation = () => void;

export type Migration = () => void;

export default class Database {
  static dbDir = `${__dirname}/db`;
  static versionFile = `${Database.dbDir}/version`;
  static drawingsFile = `${Database.dbDir}/drawings.json`;
  static usersDir = `${Database.dbDir}/users`;
  static subscriptionPostsDir = `${Database.dbDir}/subscription-posts`;
  static dailyStatsDir = `${Database.dbDir}/daily-stats`;
  static migrations: Migration[] = [
    // initial migration
    async () => {
      await fs.ensureDir(Database.dbDir);
      await fs.writeJSON(Database.drawingsFile, []);
      await fs.ensureDir(Database.usersDir);
    },

    // create subscription posts dir
    async () => {
      await fs.ensureDir(Database.subscriptionPostsDir);
    },

    // remove services subscription
    async () => {
      await Database.iterateFolderFiles<User>(Database.usersDir, async (user) => {
        await Database.unsubscribeUser(user, 'SERVICES' as any);
      });
    },

    // create daily stats dir
    async () => {
      await fs.ensureDir(Database.dailyStatsDir);
    },

    // remove manager stats
    async () => {
      const managers = await Database.getManagers();

      await Database.iterateFolderFiles<DailyStats>(Database.dailyStatsDir, async (dailyStats) => {
        await Database.saveDailyStats({
          ...dailyStats,
          clicks: dailyStats.clicks.filter(({ userId }) => !managers.includes(userId))
        });
      });
    },

    // add groupJoinUsers
    async () => {
      await Database.iterateFolderFiles<DailyStats>(Database.dailyStatsDir, async (dailyStats) => {
        await Database.saveDailyStats({
          ...dailyStats,
          groupJoinUsers: []
        });
      });
    },
  ];
  static preparations: Preparation[] = [
    // prepare drawings
    async () => {
      Database.drawings = await fs.readJSON(Database.drawingsFile, { encoding: 'utf8' });
    },

    // prepare users
    async () => {
      await Database.iterateFolderFiles<User>(Database.usersDir, (user) => {
        Database.users[user.id] = user;
      });
    },

    // prepare managers
    async () => {
      Database.managers = await Database.getManagers();
    },

    // prepare subscription posts
    async () => {
      await Database.iterateFolderFiles<SubscriptionPost>(Database.subscriptionPostsDir, (subscriptionPost) => {
        Database.subscriptionPosts[subscriptionPost.postId] = subscriptionPost;
      });
    },

    // prepare daily stats
    async () => {
      await Database.iterateFolderFiles<DailyStats>(Database.dailyStatsDir, (dailyStats) => {
        Database.dailyStats[dailyStats.date] = dailyStats;
      });
    },
  ];
  static locks: Record<string, Promise<any>> = {};

  static drawings: Drawing[] = [];
  static users: Partial<Record<number, User>> = {};
  static subscriptionPosts: Partial<Record<string, SubscriptionPost>> = {};
  static dailyStats: Partial<Record<number, DailyStats>> = {};
  static managers: number[] = [];

  static async migrate() {
    await fs.ensureFile(Database.versionFile);

    const currentVersion = +await fs.readFile(Database.versionFile, 'utf8');

    for (const migration of Database.migrations.slice(currentVersion)) {
      await migration();
    }

    await fs.writeFile(Database.versionFile, Database.migrations.length, { encoding: 'utf8' });
  }

  static async prepare() {
    for (const preparation of Database.preparations) {
      await preparation();
    }
  }

  static async iterateFolderFiles<T>(dir: string, callback: (value: T, filename: string) => void) {
    const files = await fs.readdir(dir);

    await Promise.all(
      files.map(async (pathname) => {
        const match = pathname.match(/^(\d+)\.json$/);
        const filename = `${dir}/${pathname}`;

        if (match) {
          await callback(await fs.readJSON(filename, { encoding: 'utf8' }), filename);
        }
      })
    );
  }

  static async writeToDb(file: string, data: any): Promise<void> {
    const prevLock = Database.locks[file];

    await (Database.locks[file] = (async () => {
      await prevLock;
      await fs.writeJSON(file, data, { encoding: 'utf8' });
    })());
  }

  static async getManagers(): Promise<number[]> {
    const {
      data: {
        response: {
          items: managers
        }
      }
    } = await sendVKRequest<ManagersResponse>('groups.getMembers', {
      group_id: config.soundcheckId,
      filter: 'managers'
    });

    return managers.map(({ id }) => id);
  }

  static getDrawingById(id: string): Drawing | null {
    return Database.drawings.find((drawing) => drawing.id === id) || null;
  }

  static async saveDrawings() {
    await Database.writeToDb(Database.drawingsFile, Database.drawings);
  }

  static async addDrawing(drawingParams: DrawingParams): Promise<Drawing> {
    const drawing: Drawing = {
      id: '',
      ...drawingParams
    };

    while (true) {
      drawing.id = Math.random().toString(36).slice(2);

      if (Database.drawings.every(({ id }) => id !== drawing.id)) {
        break;
      }
    }

    Database.drawings.push(drawing);

    await Database.saveDrawings();

    return drawing;
  }

  static async editDrawing<K extends keyof DrawingParams>(drawing: Drawing, key: K, value: DrawingParams[K]) {
    drawing[key] = value;

    await Database.saveDrawings();
  }

  static async deleteDrawing(id: string) {
    Database.drawings = Database.drawings.filter((drawing) => drawing.id !== id);

    await Database.saveDrawings();
  }

  static getUserById(userId: number): User {
    return Database.users[userId] = Database.users[userId] || {
      id: userId,
      lastMessageDate: 0,
      state: null,
      subscriptions: [],
    };
  }

  static async saveUser(user: User) {
    await Database.writeToDb(`${Database.usersDir}/${user.id}.json`, user);
  }

  static async editUser<K extends keyof User>(user: User, changes: Pick<User, K>) {
    Object.assign(user, changes);

    await Database.saveUser(user);
  }

  static async subscribeUser(user: User, subscription: Subscription) {
    user.subscriptions = user.subscriptions.filter((sub) => sub !== subscription);
    user.subscriptions.push(subscription);

    await Database.saveUser(user);
  }

  static async unsubscribeUser(user: User, subscription: Subscription) {
    user.subscriptions = user.subscriptions.filter((sub) => sub !== subscription);

    await Database.saveUser(user);
  }

  static getSubscriptionPostById(postId: string): SubscriptionPost {
    return Database.subscriptionPosts[postId] = Database.subscriptionPosts[postId] || {
      postId,
      sent: []
    };
  }

  static async addSentSubscriptions(subscriptionPost: SubscriptionPost, userIds: number[]) {
    subscriptionPost.sent.push(...userIds);

    await Database.writeToDb(`${Database.subscriptionPostsDir}/${subscriptionPost.postId}.json`, subscriptionPost);
  }

  static async deleteSubscriptionFile(postId: string) {
    await fs.remove(`${Database.subscriptionPostsDir}/${postId}.json`);
  }

  static getTodayDailyStats(): DailyStats {
    const startOfDay = +moment().startOf('day');

    return Database.dailyStats[+startOfDay] = Database.dailyStats[startOfDay] || {
      date: startOfDay,
      groupLeaveUsers: [],
      groupJoinUsers: [],
      clicks: [],
      reposts: [],
    };
  }

  static getPeriodDailyStats(period: 'today' | 'yesterday'): DailyStats[] {
    const stats: DailyStats[] = [];
    const start = moment();
    const end = start.clone();

    if (period === 'yesterday') {
      start.subtract(1, 'day');
      end.subtract(1, 'day');
    }

    while (start.isSameOrBefore(end)) {
      const dailyStats = Database.dailyStats[+start];

      if (dailyStats) {
        stats.push(dailyStats);
      }

      start.add(1, 'day');
    }

    return stats;
  }

  static async saveDailyStats(dailyStats: DailyStats) {
    try {
      await Database.writeToDb(`${Database.dailyStatsDir}/${dailyStats.date}.json`, dailyStats);
    } catch (err) {
      console.log('failed to save daily stats', err);
    }
  }
}
