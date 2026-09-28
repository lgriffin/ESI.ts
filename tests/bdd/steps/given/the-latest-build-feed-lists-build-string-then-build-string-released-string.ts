import { Given } from '../../support/steps';
import { queueLatestBuildFeed } from '../../support/sdeFiles';

Given(
  'the latest-build feed lists build {string} then build {string} released {string}',
  function (older: string, newest: string, releaseDate: string) {
    queueLatestBuildFeed([
      { buildNumber: older, releaseDate: '2026-09-08' },
      { buildNumber: newest, releaseDate },
    ]);
  },
);
