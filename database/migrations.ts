import * as Sequelize from 'sequelize';
import moment = require('moment-timezone');

interface Migration {
  name: string;
  action(queryInterface: Sequelize.QueryInterface, sequelize: Sequelize.Sequelize, dbVersion: number): void;
}

const migrations: Migration[] = [
  {
    name: 'create users table',
    async action(queryInterface) {
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
    }
  },

  {
    name: 'create drawings table',
    async action(queryInterface) {
      await queryInterface.createTable('drawings', {
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
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
    }
  },

  {
    name: 'create clicks table',
    async action(queryInterface) {
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
    }
  },

  {
    name: 'create daily stats table',
    async action(queryInterface) {
      await queryInterface.createTable('daily_stats', {
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
      });
    }
  },

  {
    name: 'create group users table',
    async action(queryInterface) {
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
    }
  },

  {
    name: 'create reposts table',
    async action(queryInterface) {
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
  },

  {
    name: 'add Drawing#expiresAt',
    async action(queryInterface) {
      await queryInterface.addColumn('drawings', 'expires_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: moment('2019-11-30', 'YYYY-MM-DD').toDate(),
      });
    }
  },

  {
    name: 'add Repost#ownerId',
    async action(queryInterface) {
      await queryInterface.addColumn('reposts', 'owner_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }
  },

  {
    name: 'add intermediate Repost#ownerPostId',
    async action(queryInterface) {
      await queryInterface.addColumn('reposts', 'owner_post_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }
  },

  {
    name: 'fill Repost#ownerId, Repost#ownerPostId',
    async action(_queryInterface, sequelize) {
      interface RepostForFillingOwnerIdAndOwnerPostId {
        id: number;
        ownerId: number;
        ownerPostId: number;
        postId: string;
        originalPostId: string;
        createdAt: Date;
        updatedAt: Date;
      }

      class RepostForFillingOwnerIdAndOwnerPostId extends Sequelize.Model {

      }

      RepostForFillingOwnerIdAndOwnerPostId.init({
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        ownerId: {
          type: Sequelize.INTEGER,
          field: 'owner_id',
          allowNull: false,
        },
        ownerPostId: {
          type: Sequelize.INTEGER,
          field: 'owner_post_id',
          allowNull: false,
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

      const allReposts = await RepostForFillingOwnerIdAndOwnerPostId.findAll();

      await Promise.all(
        allReposts.map(async (repost) => {
          const match = repost.postId.match(/^(-?\d+)_(\d+)$/);

          if (!match) {
            throw new Error(`Wrong postId (repost id: ${repost.id})`);
          }

          const [, ownerId, postId] = match;

          repost.ownerId = +ownerId;
          repost.ownerPostId = +postId;

          await repost.save();
        })
      );
    }
  },

  {
    name: 'remove Repost#postId',
    async action(queryInterface) {
      await queryInterface.removeColumn('reposts', 'post_id');
    }
  },

  {
    name: 'rename Repost#ownerPostId to Repost#postId',
    async action(queryInterface) {
      await queryInterface.renameColumn('reposts', 'owner_post_id', 'post_id');
    }
  },

  {
    name: 'add User#firstName',
    async action(queryInterface) {
      await queryInterface.addColumn('users', 'first_name', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '',
      });
    }
  },

  {
    name: 'add User#lastName',
    async action(queryInterface) {
      await queryInterface.addColumn('users', 'last_name', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '',
      });
    }
  },

  {
    name: 'add User#sex',
    async action(queryInterface) {
      await queryInterface.addColumn('users', 'sex', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'UNKNOWN',
      });
    }
  },

  {
    name: 'add User#bDate',
    async action(queryInterface) {
      await queryInterface.addColumn('users', 'b_date', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },
];

export default migrations;
