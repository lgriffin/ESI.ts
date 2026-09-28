import { sdeProvider } from '../../support/sde';
import { When } from '../../support/steps';

When(
  'I look up ancestries for bloodline {int}',
  function (bloodlineId: number) {
    this.result = sdeProvider(this).getAncestriesByBloodline(bloodlineId);
  },
);
