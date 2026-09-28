import { resolveTypeChain, sdeProvider, TRITANIUM } from '../../support/sde';
import { When } from '../../support/steps';

When(
  'the user looks up a type and navigates to its group and category',
  function () {
    this.result = resolveTypeChain(sdeProvider(this), TRITANIUM.typeId);
  },
);
