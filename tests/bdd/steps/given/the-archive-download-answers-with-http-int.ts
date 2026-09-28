import { Given } from '../../support/steps';
import { queueArchiveDownloadFailure } from '../../support/sdeFiles';

Given(
  'the archive download answers with HTTP {int}',
  function (status: number) {
    queueArchiveDownloadFailure(status);
  },
);
