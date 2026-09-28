import { type EveType } from '../../../../src/sde/types';
import { Then } from '../../support/steps';

Then(
  'the provider shall return types whose names contain {string}',
  function (fragment: string) {
    const types: EveType[] = this.result;
    expect(types.length).toBeGreaterThanOrEqual(1);
    for (const type of types) {
      expect(type.name.toLowerCase()).toContain(fragment.toLowerCase());
    }
  },
);
