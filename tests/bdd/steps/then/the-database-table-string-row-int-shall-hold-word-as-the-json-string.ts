import { Then } from '../../support/steps';
import { openBuiltDatabase } from '../../support/sdeFiles';

// The column is text that parses to the same value as `json`.
Then(
  'the database table {string} row {int} shall hold {word} as the JSON {string}',
  function (table: string, id: number, column: string, json: string) {
    const value = openBuiltDatabase(this).column(table, id, column);
    expect(typeof value).toBe('string');
    expect(JSON.parse(value as string)).toEqual(JSON.parse(json));
  },
);
