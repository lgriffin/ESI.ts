import { createMockCustomClient } from '../../support/mock-transport';
import { Given } from '../../support/steps';

Given(
  'a wallet client built by {string} over a mock transport',
  function (surface: string) {
    if (
      surface !== 'EsiClient' &&
      surface !== 'EsiClientBuilder' &&
      surface !== 'EsiApiFactory'
    )
      throw new Error(`Unknown construction surface: ${surface}`);
    createMockCustomClient(this, surface);
  },
);
