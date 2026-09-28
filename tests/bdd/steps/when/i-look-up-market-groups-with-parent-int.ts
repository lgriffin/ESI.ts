import { sdeProvider } from '../../support/sde';
import { When } from '../../support/steps';

When(
  'I look up market groups with parent {int}',
  function (parentGroupId: number) {
    this.result = sdeProvider(this).getMarketGroupsByParent(parentGroupId);
  },
);
