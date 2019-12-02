import { AxiosError } from 'axios';
import moment = require('moment-timezone');

import VKError from './VKError';

export default class Logger {
  static getDateString(): string {
    return moment().format('YYYY-MM-DD HH:mm:ss.SSS');
  }

  static error(err: Error | AxiosError | VKError, ...data: any[]) {
    if ('isAxiosError' in err && err.isAxiosError) {
      console.log(`error (axios) ${this.getDateString()}:`, ...data, err.response && err.response.status, err.response && err.response.data);
    } else if (err instanceof VKError) {
      console.log(`error (vk) ${this.getDateString()}:`, ...data, err.vkError);
    } else {
      console.log(`error ${this.getDateString()}:`, ...data, err);
    }
  }

  static log(...data: any[]) {
    console.log(`log ${this.getDateString()}:`, ...data);
  }

  static warn(...data: any[]) {
    console.warn(`warn ${this.getDateString()}:`, ...data);
  }
}
