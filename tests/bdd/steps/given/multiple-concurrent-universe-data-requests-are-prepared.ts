import {
  CONCURRENT_SYSTEM_IDS,
  universeFixtures,
  universeMatches,
} from '../../support/universe';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('multiple concurrent universe data requests are prepared', function () {
  CONCURRENT_SYSTEM_IDS.forEach((id, index) => {
    queueResponse({
      match: universeMatches.system(id),
      body: universeFixtures.concurrentSystem(id, index),
      // The first request is answered last, so pairing responses by
      // arrival order instead of by identifier would be caught.
      delayMs: (CONCURRENT_SYSTEM_IDS.length - index) * 10,
    });
  });
});
