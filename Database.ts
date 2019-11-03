import * as fs from 'fs-extra';

import { Drawing, DrawingParams, ManagersResponse, Subscription, User, UserState } from './types';
import { sendVKRequest } from './helpers';
import { SOUNDCHECK_ID } from './constants';

export type Preparation = () => void;

const defaultUser: User = {
  id: 0,
  state: null,
  subscriptions: []
};

export default class Database {
  static dbDir = `${__dirname}/db`;
  static drawingsFile = `${Database.dbDir}/drawings.json`;
  static usersDir = `${Database.dbDir}/users`;
  static preparations: Preparation[] = [
    // prepare db directory
    async () => {
      await fs.ensureDir(Database.dbDir);
    },

    // prepare drawings
    async () => {
      if (!await fs.pathExists(Database.drawingsFile)) {
        await fs.writeJSON(Database.drawingsFile, []);
      }

      Database.drawings = await fs.readJSON(Database.drawingsFile, { encoding: 'utf8' });
    },

    // prepare users
    async () => {
      await fs.ensureDir(Database.usersDir);

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
        group_id: SOUNDCHECK_ID,
        filter: 'managers'
      });

      Database.managers = managers.map(({ id }) => id);
    }
  ];
  static locks: Record<string, Promise<any>> = {};

  static drawings: Drawing[] = [];
  static users: Partial<Record<number, User>> = {};
  static managers: number[] = [];

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

    await Database.writeToDb(Database.drawingsFile, Database.drawings);

    return drawing;
  }

  static findDrawingById(id: string): Drawing | null {
    return Database.drawings.find((drawing) => drawing.id === id) || null;
  }

  static async editDrawing<K extends keyof DrawingParams>(id: string, key: K, value: DrawingParams[K]) {
    const drawing = Database.findDrawingById(id);

    if (drawing) {
      // @ts-ignore
      drawing[key] = value;

      await Database.writeToDb(Database.drawingsFile, Database.drawings);
    }
  }

  static async deleteDrawing(id: string) {
    const drawing = Database.findDrawingById(id);

    if (drawing) {
      Database.drawings = Database.drawings.filter((drawing) => drawing.id !== id);

      await Database.writeToDb(Database.drawingsFile, Database.drawings);
    }
  }

  static getUser(userId: number): User {
    return Database.users[userId] = Database.users[userId] || { ...defaultUser, id: userId };
  }

  static async setUserState(user: User, state: UserState) {
    user.state = state;

    await Database.writeToDb(`${Database.usersDir}/${user.id}.json`, user);
  }

  static async subscribeUser(user: User, subscription: Subscription) {
    user.subscriptions = user.subscriptions.filter((sub) => sub !== subscription);
    user.subscriptions.push(subscription);

    await Database.writeToDb(`${Database.usersDir}/${user.id}.json`, user);
  }

  static async unsubscribeUser(user: User, subscription: Subscription) {
    user.subscriptions = user.subscriptions.filter((sub) => sub !== subscription);

    await Database.writeToDb(`${Database.usersDir}/${user.id}.json`, user);
  }
}
