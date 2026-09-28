import { Then } from '../../support/steps';

// A numeric field of the returned record, named for the reader.
Then(
  /^the returned record shall carry (race|bloodline|corporation|faction|solar system|owner|dungeon|skin|duration|type|group|published) (-?\d+)$/,
  function (field: string, value: string) {
    const fields: Record<string, string> = {
      race: 'raceId',
      bloodline: 'bloodlineId',
      corporation: 'corporationId',
      faction: 'factionId',
      'solar system': 'solarSystemId',
      owner: 'ownerId',
      dungeon: 'dungeonId',
      skin: 'skinId',
      duration: 'duration',
      type: 'typeId',
      group: 'groupId',
      published: 'published',
    };
    expect(this.result).not.toBeNull();
    expect(this.result[fields[field]!]).toBe(Number(value));
  },
);
