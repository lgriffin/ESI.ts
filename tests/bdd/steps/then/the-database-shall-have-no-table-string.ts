import { Then } from '../../support/steps';
import { openBuiltDatabase } from '../../support/sdeFiles';

Then('the database shall have no table {string}', function (table: string) {
  expect(openBuiltDatabase(this).columns(table)).toBeNull();
});
