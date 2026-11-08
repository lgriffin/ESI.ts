import { identityFromToken } from '../../../../src/client';
import { RAW_TOKEN, runtimeOf } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  'the application asks the runtime for a view of one identity twice',
  function () {
    const esi = runtimeOf(this);
    const identity = identityFromToken(RAW_TOKEN);
    this.result = [esi.as(identity), esi.as(identity)];
  },
);
