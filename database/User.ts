import * as _ from 'lodash';
import * as Sequelize from 'sequelize';

import sequelize from './';
import { Subscription, UserState, VkUser } from '../types';

export enum Sex {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  UNKNOWN = 'UNKNOWN'
}

export interface UserAddValues {
  vkId: number;
  firstName: string;
  lastName: string;
  sex: Sex;
  bDate: string | null;
}

export default interface User extends UserAddValues {
  id: number;
  lastMessageDate: Date;
  state: UserState;
  subscriptions: Subscription[];
  createdAt: Date;
  updatedAt: Date;
}

export default class User extends Sequelize.Model {
  static async add(values: UserAddValues, options?: Sequelize.CreateOptions): Promise<User> {
    return this.create(values, options);
  }

  static getVkUserData(vkUser: VkUser): Pick<User, 'firstName' | 'lastName' | 'sex' | 'bDate'> {
    const sex = vkUser.sex === 1
      ? Sex.FEMALE
      : vkUser.sex === 2
        ? Sex.MALE
        : Sex.UNKNOWN;

    return {
      firstName: vkUser.first_name,
      lastName: vkUser.last_name,
      sex,
      bDate: vkUser.bdate
    };
  }

  getActualSubscriptions(): Subscription[] {
    return _.filter(Subscription, (subscription) => this.subscriptions.includes(subscription));
  }

  subscribe(subscription: Subscription) {
    if (!this.subscriptions.includes(subscription)) {
      this.subscriptions = [...this.subscriptions, subscription];
    }
  }

  unsubscribe(subscription: Subscription) {
    if (this.subscriptions.includes(subscription)) {
      this.subscriptions = this.subscriptions.filter((sub) => sub !== subscription);
    }
  }
}

User.init({
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  vkId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    unique: true,
    field: 'vk_id',
  },
  firstName: {
    type: Sequelize.STRING,
    allowNull: false,
    field: 'first_name',
  },
  lastName: {
    type: Sequelize.STRING,
    allowNull: false,
    field: 'last_name',
  },
  bDate: {
    type: Sequelize.STRING,
    allowNull: true,
    field: 'b_date',
  },
  sex: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      isIn: [Object.values(Sex)]
    }
  },
  lastMessageDate: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: () => new Date(0),
  },
  state: {
    type: Sequelize.JSONB,
    allowNull: true,
    defaultValue: null,
  },
  subscriptions: {
    type: Sequelize.JSONB,
    allowNull: false,
    defaultValue: () => [],
  },
  createdAt: {
    type: Sequelize.DATE,
    field: 'created_at',
    allowNull: false,
  },
  updatedAt: {
    type: Sequelize.DATE,
    field: 'updated_at',
    allowNull: false,
  },
}, {
  sequelize,
  tableName: 'users'
});
