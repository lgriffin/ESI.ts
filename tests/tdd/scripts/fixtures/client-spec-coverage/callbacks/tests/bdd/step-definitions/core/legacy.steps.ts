import { defineFeature, loadFeature } from 'jest-cucumber';
import { DeltaClient } from '../../../../src/clients/DeltaClient';

const feature = loadFeature('tests/bdd/features/core/0002-legacy.feature');

defineFeature(feature, (test) => {
  test('a legacy call', ({ given }) => {
    // A step registration: its callback runs, so it counts.
    given('a delta client', () => {
      const d = new DeltaClient();
      d.getInLegacyStep();
      // Declared inside the step, never run.
      const later = () => d.getUnusedInLegacy();
      void later;
    });
  });
});
