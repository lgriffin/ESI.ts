import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When(
  'the user searches for solar systems matching {string}',
  function (fragment: string) {
    this.result = sdeProvider(this).searchSolarSystemsByName(fragment);
  },
);
