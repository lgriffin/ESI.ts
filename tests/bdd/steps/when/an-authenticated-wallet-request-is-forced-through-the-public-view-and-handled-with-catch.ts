import type { ScopeTree } from '../../../../src/client';
import { CHARACTER_ID, runtimeOf } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  'an authenticated wallet request is forced through the public view and handled with catch',
  async function () {
    // A promise chain, not an await: a synchronous throw would escape it.
    const forced = runtimeOf(this).public as unknown as ScopeTree;
    this.values.thrown = false;
    try {
      await forced
        .character(CHARACTER_ID)
        .wallet.get()
        .catch((err: unknown) => {
          this.error = err;
        });
    } catch {
      this.values.thrown = true;
    }
  },
);
