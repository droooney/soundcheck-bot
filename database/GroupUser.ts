import * as Sequelize from 'sequelize';

import sequelize from './';

export interface GroupUserAddValues {
  vkId: number;
  status: boolean;
}

export default interface GroupUser extends GroupUserAddValues {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

export default class GroupUser extends Sequelize.Model {
  static async add(values: GroupUserAddValues, options?: Sequelize.CreateOptions): Promise<GroupUser> {
    return this.create(values, options);
  }
}

GroupUser.init({
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
  status: {
    type: Sequelize.BOOLEAN,
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
  tableName: 'group_users'
});
