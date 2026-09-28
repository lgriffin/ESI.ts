import { Then } from '../../support/steps';

// The noun names the records for the reader; the parent picks the foreign key checked.
Then(
  /^each (type|group) should belong to (group|category|market group) (\d+)$/,
  function (noun: string, parent: string, id: string) {
    const field = {
      group: 'groupId',
      category: 'categoryId',
      'market group': 'marketGroupId',
    }[parent];
    const records: Array<Record<string, unknown>> = this.result;
    expect(records.length).toBeGreaterThanOrEqual(1);
    for (const record of records) {
      expect(record[field!]).toBe(Number(id));
    }
  },
);
