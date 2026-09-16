import {
  NEW_CHARACTER_ID,
  SINGLE_PAGE,
  walletPaths,
} from '../../support/wallet';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a new character with no activity', function () {
  queueResponse({
    match: walletPaths.journal(NEW_CHARACTER_ID),
    headers: SINGLE_PAGE,
    body: [],
  });
});
