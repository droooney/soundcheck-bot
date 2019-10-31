import * as fs from 'fs-extra';

import { Drawing, DrawingParams, ManagersResponse, UserState } from './types';
import { sendVKRequest } from './helpers';
import { SOUNDCHECK_ID } from './constants';

export type Preparation = () => void;

export default class Database {
  static dbDir = `${__dirname}/db`;
  static drawingsFile = `${Database.dbDir}/drawings.json`;
  static userStatesDir = `${Database.dbDir}/user-states`;
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

    // prepare user states
    async () => {
      await fs.ensureDir(Database.userStatesDir);

      const users = await fs.readdir(Database.userStatesDir);

      await Promise.all(
        users.map((pathname) => async () => {
          const match = pathname.match(/^(\d+)\.json$/);

          if (match) {
            Database.userStates[match[1] as any] = await fs.readJSON(`${Database.userStatesDir}/${pathname}`, { encoding: 'utf8' });
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
  static userStates: Partial<Record<number, UserState>> = {};
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

  static async editDrawing<K extends keyof DrawingParams>(id: string, key: K, value: DrawingParams[K]) {
    const drawing = Database.drawings.find((drawing) => drawing.id === id);

    if (drawing) {
      // @ts-ignore
      drawing[key] = value;

      await Database.writeToDb(Database.drawingsFile, Database.drawings);
    }
  }

  static async removeDrawing(id: string) {
    const drawing = Database.drawings.find((drawing) => drawing.id === id);

    if (drawing) {
      Database.drawings = Database.drawings.filter((drawing) => drawing.id !== id);

      await Database.writeToDb(Database.drawingsFile, Database.drawings);
    }
  }

  static async setUserState(userId: number, state: UserState) {
    Database.userStates[userId] = state;

    await Database.writeToDb(`${Database.userStatesDir}/${userId}.json`, state);
  }
}
