import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When(
  'the user searches for types matching {string} with a limit of {int}',
  function (fragment: string, limit: number) {
    this.result = sdeProvider(this).searchTypesByName(fragment, limit);
  },
);
