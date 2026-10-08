import * as path from 'node:path';
import { When } from '../../support/steps';
import { buildDatabase, tempPath } from '../../support/sdeFiles';

When(
  'I build a SQLite database from the archive into a directory that does not exist',
  function () {
    const outputPath = path.join(tempPath(this, 'missing'), 'sde.sqlite');
    buildDatabase(this, { outputPath });
  },
);
