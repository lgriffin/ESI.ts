/**
 * Hooks every scenario bound by `support/binder.ts` runs.
 */
import { After, Before } from './steps';
import { finishTransport, startTransport } from './transport';

Before(function () {
  startTransport();
});

After(function () {
  finishTransport();
});
