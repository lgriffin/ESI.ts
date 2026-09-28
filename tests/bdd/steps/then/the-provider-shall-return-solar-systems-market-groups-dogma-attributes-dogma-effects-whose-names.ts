import { Then } from '../../support/steps';

// The noun names the records for the reader; every name is checked.
Then(
  /^the provider shall return (solar systems|market groups|dogma attributes|dogma effects) whose names contain "([^"]*)"$/,
  function (noun: string, fragment: string) {
    void noun;
    const records: Array<{ name: string }> = this.result;
    expect(records.length).toBeGreaterThanOrEqual(1);
    for (const record of records) {
      expect(record.name.toLowerCase()).toContain(fragment.toLowerCase());
    }
  },
);
