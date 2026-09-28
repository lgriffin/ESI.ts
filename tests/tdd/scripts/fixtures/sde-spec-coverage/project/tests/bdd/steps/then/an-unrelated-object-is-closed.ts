import { Then } from '../../support/steps';

Then('an unrelated object is closed', function () {
  // Same-named methods on something that is not the provider, or on `any`.
  const other = { close: (): void => undefined, getVersion: (): number => 1 };
  other.close();
  other.getVersion();
  (this.result as any).close();
});
