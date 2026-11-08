import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'ESI answers the wallet of character {int} with a balance',
  function (characterId: number) {
    queueResponse({ match: `/characters/${characterId}/wallet`, body: 1250.5 });
  },
);
