import { descendRegion, sdeProvider, THE_FORGE } from '../../support/sde';
import { When } from '../../support/steps';

When(
  'the user looks up the region and navigates through constellations and systems',
  function () {
    this.result = descendRegion(sdeProvider(this), THE_FORGE);
  },
);
