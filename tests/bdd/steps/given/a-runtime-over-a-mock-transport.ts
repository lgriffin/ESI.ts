import { createMockRuntime } from '../../support/mock-transport';
import { Given } from '../../support/steps';

Given('a runtime over a mock transport', function () {
  createMockRuntime(this);
});
