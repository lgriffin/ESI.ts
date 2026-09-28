import { Then } from '../../support/steps';

Then('the parsed files shall be {string}', function (names: string) {
  const parsed: Array<{ filename: string }> = this.result;
  expect(parsed.map((file) => file.filename)).toEqual(names.split(', '));
});
