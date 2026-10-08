import { Then } from '../../support/steps';
import { openBuiltDatabase } from '../../support/sdeFiles';

// Columns in table order, each "name TYPE", with " PRIMARY KEY" on the key.
Then(
  'the database table {string} shall have columns {string}',
  function (table: string, columns: string) {
    const actual = openBuiltDatabase(this).columns(table);
    expect(actual).not.toBeNull();
    expect(
      actual!.map(
        (column) =>
          `${column.name} ${column.type}${column.pk ? ' PRIMARY KEY' : ''}`,
      ),
    ).toEqual(columns.split(', '));
  },
);
