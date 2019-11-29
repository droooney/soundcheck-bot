import * as Sequelize from 'sequelize';

import sequelize from './';

export interface DrawingAddValues {
  name: string;
  postId: string;
  expiresAt: Date;
}

export default interface Drawing extends DrawingAddValues {
  id: number;
  active: boolean;
}

export default class Drawing extends Sequelize.Model {
  static async add(values: DrawingAddValues, options?: Sequelize.CreateOptions): Promise<Drawing> {
    return this.create(values, options);
  }

  static async getActiveDrawings(): Promise<Drawing[]> {
    return Drawing.findAll({
      where: {
        active: true
      },
      order: [['createdAt', 'ASC']]
    });
  }
}

Drawing.init({
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  active: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
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
  expiresAt: {
    type: Sequelize.DATE,
    field: 'expires_at',
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
