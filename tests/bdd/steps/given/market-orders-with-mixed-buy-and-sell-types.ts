import { THE_FORGE, marketFixtures, marketPaths } from '../../support/market';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('market orders with mixed buy and sell types', function () {
  queueResponse({
    match: marketPaths.orders(THE_FORGE),
    body: marketFixtures.mixedOrderBook(),
  });
});
