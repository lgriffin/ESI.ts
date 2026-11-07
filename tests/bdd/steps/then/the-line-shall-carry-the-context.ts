import { Then } from '../../support/steps';

Then('the line shall carry the context:', function (context: string) {
  expect(this.values.logger.lines).toHaveLength(1);
  expect(this.values.logger.lines[0].context).toEqual(JSON.parse(context));
});
