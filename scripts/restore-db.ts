import { restoreDbDump } from '../helpers';

(async () => {
  const file = process.argv[2];

  if (file) {
    await restoreDbDump(file);
  }
})();
