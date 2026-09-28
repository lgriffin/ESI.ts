import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When(
  'the user searches for market groups matching {string}',
  function (fragment: string) {
    this.result = sdeProvider(this).searchMarketGroupsByName(fragment);
  },
);
