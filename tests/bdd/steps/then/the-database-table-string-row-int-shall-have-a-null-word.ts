import { Then } from '../../support/steps';
import { openBuiltDatabase } from '../../support/sdeFiles';

Then(
  'the database table {string} row {int} shall have a null {word}',
  function (table: string, id: number, column: string) {
    expect(openBuiltDatabase(this).column(table, id, column)).toBeNull();
  },
);
