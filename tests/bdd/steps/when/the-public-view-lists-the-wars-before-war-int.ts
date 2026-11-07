import { captureOutcome } from '../../support/outcome';
import { runtimeOf } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  'the public view lists the wars before war {int}',
  async function (maxWarId: number) {
    await captureOutcome(this, () =>
      runtimeOf(this).public.wars.get({ max_war_id: maxWarId }),
    );
  },
);
