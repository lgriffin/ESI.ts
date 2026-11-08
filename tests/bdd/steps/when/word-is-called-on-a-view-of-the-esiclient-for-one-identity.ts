import { surfaceOf } from '../../support/client-construction';
import type { EsiClient } from '../../../../src/EsiClient';
import { identityFromToken } from '../../../../src/core/identity';
import { When } from '../../support/steps';

When(
  '{word} is called on a view of the EsiClient for one identity',
  function (call: string) {
    const view = (surfaceOf(this).built as EsiClient).as(
      identityFromToken('view-token'),
    );
    const calls: Record<string, () => unknown> = {
      setTokenProvider: () => view.setTokenProvider(() => Promise.resolve('t')),
      addRequestInterceptor: () => view.addRequestInterceptor((c) => c),
      addResponseInterceptor: () => view.addResponseInterceptor((c) => c),
    };
    const run = calls[call];
    if (!run) throw new Error(`No call named ${call}`);
    try {
      run();
    } catch (error: unknown) {
      this.error = error;
    }
  },
);
