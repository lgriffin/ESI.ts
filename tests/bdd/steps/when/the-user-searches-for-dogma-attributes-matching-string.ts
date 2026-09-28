import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When(
  'the user searches for dogma attributes matching {string}',
  function (fragment: string) {
    this.result = sdeProvider(this).searchDogmaAttributesByName(fragment);
  },
);
