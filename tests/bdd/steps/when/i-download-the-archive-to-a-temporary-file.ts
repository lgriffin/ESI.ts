import { When } from '../../support/steps';
import { downloadArchive } from '../../support/sdeFiles';

When('I download the archive to a temporary file', async function () {
  await downloadArchive(this);
});
