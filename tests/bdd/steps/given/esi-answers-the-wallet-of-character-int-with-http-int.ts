import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'ESI answers the wallet of character {int} with HTTP {int}',
  function (characterId: number, status: number) {
    queueResponse({
      match: `/characters/${characterId}/wallet`,
      status,
      body: { error: 'unavailable' },
    });
  },
);
