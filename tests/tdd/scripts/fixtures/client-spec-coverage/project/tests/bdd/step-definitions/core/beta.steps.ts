import { defineFeature, loadFeature } from 'jest-cucumber';
import { BetaClient } from '../../../../src/clients/BetaClient';

const feature = loadFeature('tests/bdd/features/core/0002-beta.feature');

defineFeature(feature, (test) => {
  let beta: BetaClient;

  beforeEach(() => {
    // A hook is not a step: getOnlyInHook stays uncovered.
    new BetaClient().getOnlyInHook();
  });

  const givenTwoClients = (given: (text: string, fn: () => void) => void) => {
    given('two clients', () => {
      beta = new BetaClient();
    });
  };

  test('a LEGACY call', ({ given, when }) => {
    givenTwoClients(given);
    when('beta is called', () => {
      beta.getLegacy();
    });
  });

  for (const title of ['A looped call for <label>', 'A second looped call']) {
    test(title, ({ given, when }) => {
      givenTwoClients(given);
      when('beta is called in a loop', () => {
        beta.getLooped();
      });
    });
  }
});
