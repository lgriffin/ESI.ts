import { Then } from '../../support/steps';
import { openBuiltDatabase } from '../../support/sdeFiles';

Then(
  'the database metadata shall record version {string} built on {string} and imported at {string}',
  function (version: string, buildDate: string, importedAt: string) {
    expect(openBuiltDatabase(this).metadata).toEqual({
      version,
      buildDate,
      importedAt,
    });
  },
);
