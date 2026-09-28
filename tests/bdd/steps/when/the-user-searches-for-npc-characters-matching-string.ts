import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When(
  'the user searches for NPC characters matching {string}',
  function (fragment: string) {
    this.result = sdeProvider(this).searchNpcCharactersByName(fragment);
  },
);
