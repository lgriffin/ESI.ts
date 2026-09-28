import { Then } from '../../support/steps';

// Membership and count, not order: neither provider sorts a table it reads whole.
Then(
  'the result shall be the records named {string}',
  function (names: string) {
    const records: Array<{ name: string }> = this.result;
    expect(records.map((r) => r.name).sort()).toEqual(names.split(', ').sort());
  },
);
