import { defineFeature, loadFeature } from 'jest-cucumber';

const feature = loadFeature('tests/bdd/features/core/0002-beta.feature');

defineFeature(feature, (test) => {
  test('Status is returned', ({ given, when, then }) => {
    given('a status', () => {});
    when('it is requested', () => {});
    then('it is returned', () => {});
  });
});
