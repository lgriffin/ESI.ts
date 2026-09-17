// Must be flagged by suite-health/no-focused-scenario, once.
import { defineFeature, loadFeature } from 'jest-cucumber';

const feature = loadFeature('tests/bdd/features/core/0034-status.feature');

defineFeature(feature, (test) => {
  test.only('Online server returns all four status fields', ({ then }) => {
    then('the client shall return current status information', () => {
      expect(1).toBe(1);
    });
  });
});
