import { BROKE_CHARACTER_ID, balanceMatch } from '../../support/wallet';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a character with no ISK', function () {
  queueResponse({ match: balanceMatch(BROKE_CHARACTER_ID), body: 0 });
});
