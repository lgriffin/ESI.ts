// Must be flagged by suite-health/no-disabled-scenario, three times: a skipped
// scenario, a todo scenario, and a Jest test.todo.
import { defineFeature, loadFeature } from 'jest-cucumber';

const feature = loadFeature('tests/bdd/features/core/0034-status.feature');

defineFeature(feature, (test) => {
  test.skip('Online server returns all four status fields', ({ then }) => {
    then('the client shall return current status information', () => {
      expect(1).toBe(1);
    });
  });

  test.todo('Player count is a non-negative number');
});

test.todo('write this test');
