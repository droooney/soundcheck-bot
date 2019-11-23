import * as Sequelize from 'sequelize';

import sequelize from './';

export default interface GroupUser {
  id: number;
  vkId: number;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default class GroupUser extends Sequelize.Model {

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
