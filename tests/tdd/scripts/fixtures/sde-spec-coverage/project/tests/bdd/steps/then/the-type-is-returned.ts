import { Then } from '../../support/steps';

Then('the type is returned', function () {
  if (this.result === undefined) throw new Error('no type');
});
