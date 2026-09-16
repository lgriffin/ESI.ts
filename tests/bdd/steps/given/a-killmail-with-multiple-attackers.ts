import {
  MULTI_ATTACKER_KILLMAIL,
  killmailFixtures,
  killmailPaths,
} from '../../support/killmails';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a killmail with multiple attackers', function () {
  queueResponse({
    match: killmailPaths.detail(MULTI_ATTACKER_KILLMAIL),
    body: killmailFixtures.multiAttackerDetail(),
  });
});
