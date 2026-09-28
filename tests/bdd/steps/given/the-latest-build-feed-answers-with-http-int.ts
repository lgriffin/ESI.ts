import { Given } from '../../support/steps';
import { queueLatestBuildFailure } from '../../support/sdeFiles';

Given(
  'the latest-build feed answers with HTTP {int}',
  function (status: number) {
    queueLatestBuildFailure(status);
  },
);
