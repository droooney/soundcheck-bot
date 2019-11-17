import * as Sequelize from 'sequelize';

type Migration = (queryInterface: Sequelize.QueryInterface, sequelize: Sequelize.Sequelize) => void;

const migrations: Migration[] = [
  // create users
  async (queryInterface) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      vkId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        field: 'vk_id',
      },
      lastMessageDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      state: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        field: 'created_at',
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        field: 'updated_at',
        allowNull: false
      },
    });
  },
];

export default migrations;
