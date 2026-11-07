import { When } from '../../support/steps';

When('the memory token storage is cleared', function () {
  this.values.memoryStorage.clear();
});
