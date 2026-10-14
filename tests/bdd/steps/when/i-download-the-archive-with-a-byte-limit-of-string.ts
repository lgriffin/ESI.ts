import { When } from '../../support/steps';
import { downloadArchive } from '../../support/sdeFiles';

When(
  'I download the archive with a byte limit of {string}',
  async function (limit: string) {
    await downloadArchive(this, { maxBytes: Number(limit) });
  },
);
