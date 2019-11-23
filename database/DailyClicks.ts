import * as Sequelize from 'sequelize';

import sequelize from './';
import { ClicksGroup } from '../types';

export default interface DailyClicks {
  id: number;
  date: Date;
  clicks: ClicksGroup[];
}

export default class DailyClicks extends Sequelize.Model {

}

DailyClicks.init({
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  date: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  clicks: {
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
  tableName: 'daily_clicks'
});
