import * as Sequelize from 'sequelize';

import sequelize from './';
import { Subscription, UserState } from '../types';

export default interface User {
  id: number;
  vkId: number;
  lastMessageDate: Date;
  state: UserState;
  subscriptions: Subscription[];
  createdAt: Date;
  updatedAt: Date;
}

export default class User extends Sequelize.Model {
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
