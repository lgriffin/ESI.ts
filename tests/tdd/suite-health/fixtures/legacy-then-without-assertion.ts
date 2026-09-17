// Linted as tests/bdd/step-definitions/: must be flagged by jest/expect-expect
// once, for the then step. The and step's assertion does not cover it.
import { defineFeature, loadFeature } from 'jest-cucumber';

const feature = loadFeature('tests/bdd/features/core/0034-status.feature');

defineFeature(feature, (test) => {
  test('Online server returns all four status fields', ({
    when,
    then,
    and,
  }) => {
    let result: unknown;

    when('the client requests the server status', async () => {
      result = await Promise.resolve({ players: 1 });
    });

    then('the client shall return current status information', () => {
      void result;
    });

    and('the client sent 1 request', () => {
      expect(result).toBeDefined();
    });
  });
});
