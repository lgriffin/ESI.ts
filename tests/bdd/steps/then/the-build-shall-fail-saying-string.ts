import { Then } from '../../support/steps';

Then('the build shall fail saying {string}', function (message: string) {
  expect(this.error).toBeInstanceOf(Error);
  expect((this.error as Error).message).toBe(message);
});
