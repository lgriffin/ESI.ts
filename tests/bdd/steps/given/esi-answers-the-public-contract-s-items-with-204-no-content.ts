import { PUBLIC_CONTRACT_ITEMS_PATH } from '../../support/shared-runtime';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  "ESI answers the public contract's items with 204 No Content",
  function () {
    queueResponse({ match: PUBLIC_CONTRACT_ITEMS_PATH, status: 204, body: '' });
  },
);
