import { Then } from '../../support/steps';

// The length of a list field on a type extension record.
Then(
  /^the returned record shall list (\d+) (dogma attributes?|materials?|role bonus(?:es)?)$/,
  function (count: string, list: string) {
    const field = list.startsWith('dogma')
      ? 'dogmaAttributes'
      : list.startsWith('material')
        ? 'materials'
        : 'roleBonuses';
    expect(this.result).not.toBeNull();
    expect(this.result[field]).toHaveLength(Number(count));
  },
);
