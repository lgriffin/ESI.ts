import { loggedText } from '../../support/logging';
import { Then } from '../../support/steps';

Then('no logged line shall contain {string}', function (secret: string) {
  const text = loggedText(this.values.logger);
  expect(text.length).toBeGreaterThan(0);
  expect(text.filter((line) => line.includes(secret))).toEqual([]);
});
