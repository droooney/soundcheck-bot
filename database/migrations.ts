import * as Sequelize from 'sequelize';

type Migration = (queryInterface: Sequelize.QueryInterface, sequelize: Sequelize.Sequelize, dbVersion: number) => void;

const migrations: Migration[] = [
  // create users table
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
        type: Sequelize.JSONB,
        allowNull: true,
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
    });
  },

  // create drawings table
  async (queryInterface) => {
    await queryInterface.createTable('drawings', {
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
    });
  },

  // create clicks table
  async (queryInterface) => {
    await queryInterface.createTable('clicks', {
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
    });
  },

  // create daily clicks table
  async (queryInterface) => {
    await queryInterface.createTable('daily_clicks', {
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
    });
  },

  // add Drawing#active column
  async (queryInterface) => {
    await queryInterface.addColumn('drawings', 'active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },

  // add group users table
  async (queryInterface) => {
    await queryInterface.createTable('group_users', {
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
    });
  },

  // create reposts table
  async (queryInterface) => {
    await queryInterface.createTable('reposts', {
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
    });
  }
];

export default migrations;
