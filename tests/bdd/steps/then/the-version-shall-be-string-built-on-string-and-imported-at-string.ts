import { Then } from '../../support/steps';

Then(
  'the version shall be {string} built on {string} and imported at {string}',
  function (version: string, buildDate: string, importedAt: string) {
    expect(this.result).toEqual({ version, buildDate, importedAt });
  },
);
