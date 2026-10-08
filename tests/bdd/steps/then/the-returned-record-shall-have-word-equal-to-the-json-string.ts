import { Then } from '../../support/steps';

Then(
  'the returned record shall have {word} equal to the JSON {string}',
  function (field: string, json: string) {
    expect(this.result).not.toBeNull();
    expect(this.result).toHaveProperty(field);
    expect(this.result[field]).toEqual(JSON.parse(json));
  },
);
