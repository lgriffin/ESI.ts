import { Then } from '../../support/steps';

// The foreign key every record of a filtered list shares.
Then(
  /^each returned record shall carry (faction|solar system|owner|corporation|skin) (\d+)$/,
  function (field: string, value: string) {
    const fields: Record<string, string> = {
      faction: 'factionId',
      'solar system': 'solarSystemId',
      owner: 'ownerId',
      corporation: 'corporationId',
      skin: 'skinId',
    };
    const records: Array<Record<string, unknown>> = this.result;
    expect(records.length).toBeGreaterThan(0);
    for (const record of records) {
      expect(record[fields[field]!]).toBe(Number(value));
    }
  },
);
