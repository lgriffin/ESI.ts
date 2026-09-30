import { customClientOf } from '../../support/custom-client';
import { Then } from '../../support/steps';

Then(
  'the custom client shall list {string} as its enabled clients',
  function (list: string) {
    expect(customClientOf(this).getEnabledClients()).toEqual(list.split(','));
  },
);
