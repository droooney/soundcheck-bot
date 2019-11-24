import * as Sequelize from 'sequelize';

import sequelize from './';
import { ButtonPayload } from '../types';

export interface ClickAddValues {
  vkId: number;
  payload: ButtonPayload;
}

export default interface Click extends ClickAddValues {
  id: number;
  createdAt: Date;
}

export default class Click extends Sequelize.Model {
  static async add(values: ClickAddValues, options?: Sequelize.CreateOptions): Promise<Click> {
    return this.create(values, options);
  }
}

Click.init({
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  vkId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    field: 'vk_id',
  },
  payload: {
    type: Sequelize.JSONB,
    allowNull: false,
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
  tableName: 'clicks'
});
