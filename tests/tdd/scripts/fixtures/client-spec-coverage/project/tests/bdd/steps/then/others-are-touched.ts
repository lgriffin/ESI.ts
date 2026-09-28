import { Then } from '../../support/steps';

Then('others are touched', function () {
  // Same-named methods on something that is not a client, on `any`, and
  // the inherited and overridden methods of the base class.
  const other = { getAmbiguous: (): number => 1 };
  other.getAmbiguous();
  (this.result as any).getLegacy();
  this.alpha.inherited();
});
