import { THE_FORGE, marketFixtures, marketPaths } from '../../support/market';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('historical market data with trending prices', function () {
  queueResponse({
    match: marketPaths.history(THE_FORGE),
    body: marketFixtures.risingHistory(),
  });
});
