import { defineFeature, loadFeature } from 'jest-cucumber';

const feature = loadFeature('tests/bdd/features/core/0002-legacy.feature');
const computed = () => 'a bound scenario';

defineFeature(feature, (test) => {
  test('a bound scenario', ({ given }) => {
    given('a client', () => undefined);
  });

  test(computed(), ({ given }) => {
    given('a client', () => undefined);
  });
});
