import { Given } from '../../support/steps';
import { queueArchiveDownloadWithoutLength } from '../../support/sdeFiles';

Given(
  'the archive download serves {int} bytes after {int} ms',
  function (bytes: number, delayMs: number) {
    queueArchiveDownloadWithoutLength(this, bytes, delayMs);
  },
);
