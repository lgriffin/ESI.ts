import { Then } from '../../support/steps';

Then('the answer shall be {word}', function (answer: string) {
  expect(this.error).toBeUndefined();
  expect(this.result).toBe(answer === 'true');
});
