import * as Sequelize from 'sequelize';

import sequelize from './';
import { ButtonPayload } from '../types';

export default interface Click {
  id: number;
  vkId: number;
  payload: ButtonPayload;
  createdAt: Date;
}

export default class Click extends Sequelize.Model {

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
