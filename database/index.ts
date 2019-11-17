import * as Sequelize from 'sequelize';
import * as fs from 'fs-extra';

import config from '../config';
import migrations from './migrations';

const sequelize = new Sequelize.Sequelize(config.dbConnection);
const versionFile = `${__dirname}/version`;

export async function migrate() {
  await fs.ensureFile(versionFile);

  const currentVersion = +await fs.readFile(versionFile, 'utf8');
  const queryInterface = sequelize.getQueryInterface();

  for (const [i, migration] of migrations.slice(currentVersion).entries()) {
    await migration(queryInterface, sequelize);
    await fs.writeFile(versionFile, currentVersion + i + 1, { encoding: 'utf8' });
  }
}

export default sequelize;
