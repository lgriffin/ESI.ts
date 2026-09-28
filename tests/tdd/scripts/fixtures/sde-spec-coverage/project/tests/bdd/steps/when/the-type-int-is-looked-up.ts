import { When } from '../../support/steps';

When('the type {int} is looked up', function (typeId: number) {
  // A comment naming getAllCategories() is not a call.
  this.result = this.sde.getType(typeId);
});
