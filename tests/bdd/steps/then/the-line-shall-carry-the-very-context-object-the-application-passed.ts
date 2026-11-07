import { Then } from '../../support/steps';

Then(
  'the line shall carry the very context object the application passed',
  function () {
    expect(this.values.logger.lines).toHaveLength(1);
    expect(this.values.logger.lines[0].context).toBe(this.values.passedContext);
  },
);
