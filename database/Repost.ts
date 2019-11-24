import * as Sequelize from 'sequelize';

import sequelize from './';

export interface RepostAddValues {
  postId: string;
  originalPostId: string;
}

export default interface Repost extends RepostAddValues {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

export default class Repost extends Sequelize.Model {
  static async add(values: RepostAddValues, options?: Sequelize.CreateOptions): Promise<Repost> {
    return this.create(values, options);
  }
}

Repost.init({
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  postId: {
    type: Sequelize.STRING,
    allowNull: false,
    field: 'post_id',
  },
  originalPostId: {
    type: Sequelize.STRING,
    allowNull: false,
    field: 'original_post_id',
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
  tableName: 'reposts'
});
