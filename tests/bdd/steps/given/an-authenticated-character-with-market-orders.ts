import {
  TRADER_CHARACTER_ID,
  marketFixtures,
  marketPaths,
} from '../../support/market';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an authenticated character with market orders', function () {
  queueResponse({
    match: marketPaths.characterOrders(TRADER_CHARACTER_ID),
    body: marketFixtures.characterOpenOrders(),
  });
});
