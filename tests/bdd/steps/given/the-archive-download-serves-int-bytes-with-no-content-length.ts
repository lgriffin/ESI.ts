import { Given } from '../../support/steps';
import { queueArchiveDownloadWithoutLength } from '../../support/sdeFiles';

Given(
  'the archive download serves {int} bytes with no content length',
  function (bytes: number) {
    queueArchiveDownloadWithoutLength(this, bytes);
  },
);
