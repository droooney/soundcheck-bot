import * as Sequelize from 'sequelize';

import sequelize from './';

export default interface Repost {
  id: number;
  postId: string;
  originalPostId: string;
  createdAt: Date;
  updatedAt: Date;
}

export default class Repost extends Sequelize.Model {

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
