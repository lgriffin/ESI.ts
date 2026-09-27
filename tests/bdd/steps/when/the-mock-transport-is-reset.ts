import { transportOf } from '../../support/mock-transport';
import { When } from '../../support/steps';

When('the mock transport is reset', function () {
  transportOf(this).reset();
});
