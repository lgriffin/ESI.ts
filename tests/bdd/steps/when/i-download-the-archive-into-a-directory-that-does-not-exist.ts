import * as path from 'node:path';
import { When } from '../../support/steps';
import { downloadArchive, tempPath } from '../../support/sdeFiles';

When(
  'I download the archive into a directory that does not exist',
  async function () {
    const outputPath = path.join(tempPath(this, 'missing'), 'download.zip');
    await downloadArchive(this, { outputPath });
  },
);
