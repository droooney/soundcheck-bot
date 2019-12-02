import * as Sequelize from 'sequelize';
import * as fs from 'fs-extra';

import config from '../config';
import migrations from './migrations';
import Logger from '../Logger';

const sequelize = new Sequelize.Sequelize({
  ...config.dbConnection,
  logging(...args) {
    Logger.log(...args);
  },
  logQueryParameters: true
});
const versionFile = `${__dirname}/version`;

export async function migrate() {
  await fs.ensureFile(versionFile);

  const currentVersion = +await fs.readFile(versionFile, 'utf8');
  const queryInterface = sequelize.getQueryInterface();

  for (const [i, migration] of migrations.slice(currentVersion).entries()) {
    console.log(`migration "${migration.name}" started`);

    await migration.action(queryInterface, sequelize, currentVersion + i);
    await fs.writeFile(versionFile, currentVersion + i + 1, { encoding: 'utf8' });

    console.log(`migration "${migration.name}" completed successfully`);
  }
}

export default sequelize;
