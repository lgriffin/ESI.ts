import {
  PAGE_TWO_CURSOR,
  paragonHubFixtures,
  paragonHubPaths,
} from '../../support/paragon-hub';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('multiple pages of listings exist', function () {
  queueResponse({
    match: paragonHubPaths.afterCursor(PAGE_TWO_CURSOR),
    body: paragonHubFixtures.pageTwo(),
  });
});
