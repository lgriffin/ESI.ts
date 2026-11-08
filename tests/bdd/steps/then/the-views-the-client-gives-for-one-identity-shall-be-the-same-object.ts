import { surfaceOf } from '../../support/client-construction';
import type { EsiClient } from '../../../../src/EsiClient';
import type { CustomEsiClient } from '../../../../src/EsiClientBuilder';
import { identityFromToken } from '../../../../src/core/identity';
import { Then } from '../../support/steps';

Then(
  'the views the client gives for one identity shall be the same object',
  function () {
    const built = surfaceOf(this).built as EsiClient | CustomEsiClient;
    const identity = identityFromToken('view-token');
    const first = built.as(identity);
    expect(first).not.toBe(built);
    expect(built.as(identity)).toBe(first);
  },
);
