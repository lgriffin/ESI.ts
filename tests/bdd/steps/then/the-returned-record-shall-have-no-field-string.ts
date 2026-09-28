import { Then } from '../../support/steps';

Then(
  'the returned record shall have no field {string}',
  function (field: string) {
    expect(this.result).not.toBeNull();
    expect(this.result).not.toHaveProperty(field);
  },
);
