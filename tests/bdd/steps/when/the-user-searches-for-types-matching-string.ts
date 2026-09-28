import { sdeProvider } from '../../support/sde';
import { When } from '../../support/steps';

When(
  'the user searches for types matching {string}',
  function (fragment: string) {
    this.result = sdeProvider(this).searchTypesByName(fragment);
  },
);
