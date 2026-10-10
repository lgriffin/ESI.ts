import { walkWithPagedMethod } from '../../support/security-boundary';
import { When } from '../../support/steps';

When(
  'the consumer walks the route through a paged client method',
  async function () {
    await walkWithPagedMethod(this);
  },
);
