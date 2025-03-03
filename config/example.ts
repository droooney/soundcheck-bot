import { Config } from '../types';

const config: Config = {
  dbConnection: {
    dialect: 'postgres',
    username: 'user',
    password: 'password',
    host: 'localhost',
    port: 5432,
    database: 'soundcheck_bot_dev'
  },
  port: 5778,
  endpoint: '/9lyvg7xn27axayu5ybpy3o1og67',
  soundcheckId: 164134127,
  vkToken: '2d0c91d1f4f816ed81c83008fa171fe5642e9153de1bebdf08f993392675512944a731975ad559157906b',
  confirmationCode: 'afcb8751',
  targets: {
    tellAboutGroup: [175810060],
    tellAboutRelease: [175810060],
    tellAboutBug: [175810060],
    wantToParticipate: [175810060],
    other: [175810060],
    poster: [175810060],
    stats: [175810060],
    unknownMessage: [175810060],
  },
  googleDriveDumpsFolderName: 'dumps_dev',
};

export default config;
