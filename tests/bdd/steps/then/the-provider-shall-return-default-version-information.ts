import { type SdeVersionInfo } from '../../../../src/sde/version';
import { Then } from '../../support/steps';

Then('the provider shall return default version information', function () {
  const version: SdeVersionInfo = this.result;
  expect(version.version).toBeDefined();
  expect(version.buildDate).toBeDefined();
  expect(version.importedAt).toBeDefined();
});
