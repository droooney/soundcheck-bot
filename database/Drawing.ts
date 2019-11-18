import * as Sequelize from 'sequelize';

import sequelize from './';

export default interface Drawing {
  id: number;
  name: string;
  postId: string;
}

export default class Drawing extends Sequelize.Model {

}

Drawing.init({
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  postId: {
    type: Sequelize.STRING,
    field: 'post_id',
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
  tableName: 'drawings'
});
