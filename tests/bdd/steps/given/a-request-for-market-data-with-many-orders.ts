import {
  LARGE_ORDER_BOOK_SIZE,
  THE_FORGE,
  marketFixtures,
  marketPaths,
} from '../../support/market';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a request for market data with many orders', function () {
  queueResponse({
    match: marketPaths.orders(THE_FORGE),
    body: marketFixtures.largeOrderBook(LARGE_ORDER_BOOK_SIZE),
  });
});
