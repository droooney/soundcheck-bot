import * as Sequelize from 'sequelize';

import sequelize from './';
import { ClicksGroup, Subscription } from '../types';

export interface DailyStatsAddValues {
  date: Date;
  clickGroups: ClicksGroup[];
  userClicks: Record<number, number>;
  subscriptions: Record<Subscription, number>;
}

export default interface DailyStats extends DailyStatsAddValues {
  id: number;
}

export default class DailyStats extends Sequelize.Model {
  static async add(values: DailyStatsAddValues, options?: Sequelize.CreateOptions): Promise<DailyStats> {
    return this.create(values, options);
  }
}

DailyStats.init({
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
  clickGroups: {
    type: Sequelize.JSONB,
    allowNull: false,
    field: 'click_groups',
  },
  userClicks: {
    type: Sequelize.JSONB,
    allowNull: false,
    field: 'user_clicks',
  },
  subscriptions: {
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
  tableName: 'daily_stats'
});
