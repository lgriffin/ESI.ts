import { PUBLIC_CONTRACT_BIDS_PATH } from '../../support/shared-runtime';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  "ESI answers the public contract's bids with an empty 200 response",
  function () {
    queueResponse({
      match: PUBLIC_CONTRACT_BIDS_PATH,
      status: 200,
      body: '',
      headers: { 'content-length': '0' },
    });
  },
);
