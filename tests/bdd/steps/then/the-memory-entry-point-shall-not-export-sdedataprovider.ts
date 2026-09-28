import { Then } from '../../support/steps';

Then('the memory entry point shall not export SdeDataProvider', function () {
  expect(this.result.memoryExportsSdeDataProvider).toBe(false);
});
