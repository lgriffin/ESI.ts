import { attempt, manager } from '../../support/token-manager';
import { When } from '../../support/steps';

When(
  'refreshAll runs with expiringWithinMs {int}',
  async function (expiringWithinMs: number) {
    await attempt(this, () =>
      manager(this).manager.refreshAll({ expiringWithinMs }),
    );
  },
);
