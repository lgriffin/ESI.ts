import { captureOutcome } from '../../support/outcome';
import { runtimeOf } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  'the public view requests the OpenAPI document in JSON form',
  async function () {
    await captureOutcome(this, () =>
      runtimeOf(this).public.meta.openapiJson.get(),
    );
  },
);
