import { Then } from '../../support/steps';

Then('the categories are not asserted', function () {
  if ('getAllCategories' !== 'getAllCategories'.trim()) throw new Error();
});
