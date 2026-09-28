import { Then } from '../../support/steps';

// The collection under `this.result`, read as the IDs under `field`, is
// non-empty and strictly ascending.
Then(
  'the returned records shall be ordered by {string} ascending',
  function (field: string) {
    const records = this.result as Array<Record<string, unknown>>;
    const ids = records.map((record) => record[field] as number);
    expect(ids.length).toBeGreaterThan(1);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
  },
);
