import { Then } from '../../support/steps';
import { openBuiltDatabase } from '../../support/sdeFiles';

Then(
  /^the database table "([^"]*)" shall hold (\d+) rows?$/,
  function (table: string, count: string) {
    expect(openBuiltDatabase(this).rowCount(table)).toBe(Number(count));
  },
);
