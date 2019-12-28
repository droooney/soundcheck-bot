import * as Sequelize from 'sequelize';

import sequelize from './';

export interface KeyValues {
  latest_releases_link: string;
  latest_digest_link: string;
}

export interface KeyValuePairAddValues<K extends keyof KeyValues> {
  key: K;
  value: KeyValues[K];
}

export default interface KeyValuePair<K extends keyof KeyValues> extends KeyValuePairAddValues<K> {
  createdAt: Date;
  updatedAt: Date;
}

const defaultValues: KeyValues = {
  latest_releases_link: 'https://vk.com/wall-177574047_2281',
  latest_digest_link: 'https://vk.com/wall-177574047_2028',
};

export default class KeyValuePair<K extends keyof KeyValues> extends Sequelize.Model {
  static async findOrAdd<K extends keyof KeyValues>(key: K): Promise<KeyValuePair<K>> {
    return (await this.findOrCreate({
      where: { key },
      defaults: { key, value: defaultValues[key] }
    }))[0] as KeyValuePair<K>;
  }
}

KeyValuePair.init({
  key: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  value: {
    type: Sequelize.JSONB,
    allowNull: true,
    defaultValue: null,
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
  tableName: 'key_value_pairs'
});
