import { THE_FORGE, marketFixtures, marketPaths } from '../../support/market';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a valid region and item type', function () {
  this.values.expectedHistory = marketFixtures.twoDayHistory();
  queueResponse({
    match: marketPaths.history(THE_FORGE),
    body: this.values.expectedHistory,
  });
});
