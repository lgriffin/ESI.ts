import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When(
  'the user searches for dogma effects matching {string}',
  function (fragment: string) {
    this.result = sdeProvider(this).searchDogmaEffectsByName(fragment);
  },
);
