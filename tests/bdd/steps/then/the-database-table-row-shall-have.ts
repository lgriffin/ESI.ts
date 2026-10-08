import { Then } from '../../support/steps';
import { openBuiltDatabase } from '../../support/sdeFiles';

// A stored column of one row: quoted for text, bare for a number.
Then(
  /^the database table "([^"]*)" row (\d+) shall have (\w+) (?:"([^"]*)"|(-?\d+(?:\.\d+)?))$/,
  function (
    table: string,
    id: string,
    column: string,
    text: string | undefined,
    number: string | undefined,
  ) {
    const value = openBuiltDatabase(this).column(table, Number(id), column);
    expect(value).toBe(text ?? Number(number));
  },
);
