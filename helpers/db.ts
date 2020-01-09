import * as fs from 'fs-extra';
import moment = require('moment-timezone');

import { executeCommand } from './common';
import config from '../config';
import { dumpDir, versionFile } from '../constants';

export async function createDbDump(): Promise<string> {
  const currentVersion = +await fs.readFile(versionFile, 'utf8');
  const { username, host, database } = config.dbConnection;
  const filename = `${dumpDir}/db_dump-v${currentVersion}-${moment().format('YYYY-MM-DDTHH-mm')}.sql`;
  const command = `pg_dump -U ${username} -h ${host} ${database} > ${filename}`;

  await executeCommand(command, { cwd: process.cwd() });

  return filename;
}

export async function restoreDbDump(filename: string) {
  const { username, host, database } = config.dbConnection;
  const command = `psql -U ${username} -h ${host} ${database} < ${filename}`;

  await executeCommand(command, { cwd: process.cwd() });

  return filename;
}
