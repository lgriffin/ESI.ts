import { Then } from '../../support/steps';

Then('the answer shall be {word}', function (answer: string) {
  expect(this.result).toBe(answer === 'true');
});
