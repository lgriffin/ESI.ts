import {
  TRADER_CHARACTER_ID,
  marketFixtures,
  marketPaths,
} from '../../support/market';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an authenticated character with order history', function () {
  queueResponse({
    match: marketPaths.characterOrderHistory(TRADER_CHARACTER_ID),
    body: marketFixtures.characterOrderHistory(),
  });
});
