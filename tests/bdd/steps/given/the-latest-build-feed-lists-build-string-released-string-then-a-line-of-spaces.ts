import { Given } from '../../support/steps';
import { queueLatestBuildFeedText } from '../../support/sdeFiles';

Given(
  'the latest-build feed lists build {string} released {string} then a line of spaces',
  function (buildNumber: string, releaseDate: string) {
    queueLatestBuildFeedText(
      `${JSON.stringify({ buildNumber, releaseDate })}\n   \n`,
    );
  },
);
