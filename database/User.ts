import * as Sequelize from 'sequelize';

import sequelize from './';
import { UserState } from '../types';

export default interface User {
  id: number;
  vkId: number;
  lastMessageDate: Date;
  state: UserState;
  createdAt: Date;
  updatedAt: Date;
}

export default class User extends Sequelize.Model {
  static tableName = 'users';
  static defaults = {
    lastMessageDate: new Date(0),
    state: null
  };
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
  },
  state: {
    type: Sequelize.JSON,
    allowNull: true,
  },
  createdAt: {
    type: Sequelize.DATE,
    field: 'created_at',
    allowNull: false
  },
  updatedAt: {
    type: Sequelize.DATE,
    field: 'updated_at',
    allowNull: false
  },
}, { sequelize });
