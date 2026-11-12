import { queueStatus } from '../../support/status';
import { Given } from '../../support/steps';

Given(
  'the server is online with gradually changing player counts',
  function () {
    // Served in order, one per poll.
    for (const players of [30000, 31000, 32500]) queueStatus(players);
  },
);
