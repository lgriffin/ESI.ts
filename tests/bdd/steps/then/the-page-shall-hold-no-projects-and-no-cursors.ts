import { Then } from '../../support/steps';

Then('the page shall hold no projects and no cursors', function () {
  expect(this.error).toBeUndefined();
  expect(this.result).toEqual({
    data: [],
    cursors: { before: null, after: null },
  });
});
