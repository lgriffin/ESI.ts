import { THE_FORGE, marketFixtures, marketPaths } from '../../support/market';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a valid region ID', function () {
  queueResponse({
    match: marketPaths.orders(THE_FORGE),
    body: marketFixtures.regionOrderBook(),
  });
});
