import { THE_FORGE, marketFixtures, marketPaths } from '../../support/market';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a market analysis requirement', function () {
  queueResponse({
    match: marketPaths.prices,
    body: marketFixtures.analysisPrice(),
  });
  queueResponse({
    match: marketPaths.orders(THE_FORGE),
    body: marketFixtures.analysisOrderBook(),
  });
  queueResponse({
    match: marketPaths.history(THE_FORGE),
    body: marketFixtures.analysisHistory(),
  });
});
