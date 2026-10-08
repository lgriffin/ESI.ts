import { When } from '../../support/steps';
import { downloadArchive } from '../../support/sdeFiles';

When(
  'I download the archive and abort it after {int} ms',
  async function (abortAfterMs: number) {
    await downloadArchive(this, { abortAfterMs });
  },
);
