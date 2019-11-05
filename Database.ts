import * as fs from 'fs-extra';

import { Drawing, DrawingParams, ManagersResponse, Subscription, User } from './types';
import { sendVKRequest } from './helpers';
import config from './config';

export type Preparation = () => void;

export type Migration = () => void;

const defaultUser: User = {
  id: 0,
  lastMessageDate: 0,
  state: null,
  subscriptions: []
};

export default class Database {
  static dbDir = `${__dirname}/db`;
  static versionFile = `${Database.dbDir}/version`;
  static drawingsFile = `${Database.dbDir}/drawings.json`;
  static usersDir = `${Database.dbDir}/users`;
  static subscriptionPostsDir = `${Database.dbDir}/subscription-posts`;
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
      const users = await fs.readdir(Database.usersDir);

      await Promise.all(
        users.map(async (pathname) => {
          const match = pathname.match(/^(\d+)\.json$/);

          if (match) {
            const user = await fs.readJSON(`${Database.usersDir}/${pathname}`, { encoding: 'utf8' });

            await Database.unsubscribeUser(user, 'SERVICES' as any);
          }
        })
      );
    },
  ];
  static preparations: Preparation[] = [
    // prepare drawings
    async () => {
      Database.drawings = await fs.readJSON(Database.drawingsFile, { encoding: 'utf8' });
    },

    // prepare users
    async () => {
      const users = await fs.readdir(Database.usersDir);

      await Promise.all(
        users.map(async (pathname) => {
          const match = pathname.match(/^(\d+)\.json$/);

          if (match) {
            Database.users[match[1] as any] = await fs.readJSON(`${Database.usersDir}/${pathname}`, { encoding: 'utf8' });
          }
        })
      );
    },

    // prepare managers
    async () => {
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

      Database.managers = managers.map(({ id }) => id);
    },

    // prepare subscription posts
    async () => {
      const subscriptionPosts = await fs.readdir(Database.subscriptionPostsDir);

      await Promise.all(
        subscriptionPosts.map(async (pathname) => {
          const match = pathname.match(/^(-?\d+_\d+)\.json$/);

          if (match) {
            Database.subscriptionPosts[match[1] as any] = await fs.readJSON(`${Database.subscriptionPostsDir}/${pathname}`, { encoding: 'utf8' });
          }
        })
      );
    },
  ];
  static locks: Record<string, Promise<any>> = {};

  static drawings: Drawing[] = [];
  static users: Partial<Record<number, User>> = {};
  static subscriptionPosts: Partial<Record<string, number[]>> = {};
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

  static async writeToDb(file: string, data: any): Promise<void> {
    const prevLock = Database.locks[file];

    await (Database.locks[file] = (async () => {
      await prevLock;
      await fs.writeJSON(file, data, { encoding: 'utf8' });
    })());
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
    return Database.users[userId] = Database.users[userId] || { ...defaultUser, id: userId };
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

  static async addSentSubscriptions(postId: string, userIds: number[]) {
    const sentSubscriptions = Database.subscriptionPosts[postId] = Database.subscriptionPosts[postId] || [];

    sentSubscriptions.push(...userIds);

    await Database.writeToDb(`${Database.subscriptionPostsDir}/${postId}.json`, sentSubscriptions);
  }

  static async deleteSubscriptionFile(postId: string) {
    await fs.remove(`${Database.subscriptionPostsDir}/${postId}.json`);
  }
}
