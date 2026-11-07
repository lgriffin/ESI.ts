import { Then } from '../../support/steps';

Then('the line shall carry no context', function () {
  expect(this.values.logger.lines).toHaveLength(1);
  expect(this.values.logger.lines[0].context).toBeUndefined();
});
