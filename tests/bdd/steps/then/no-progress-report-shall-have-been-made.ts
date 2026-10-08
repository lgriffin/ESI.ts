import { Then } from '../../support/steps';

Then('no progress report shall have been made', function () {
  const progress: Array<[number, number]> = this.values.progress;
  expect(progress).toEqual([]);
});
