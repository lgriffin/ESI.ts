import { surfaceOf } from '../../support/client-construction';
import type { EsiClient } from '../../../../src/EsiClient';
import type { CustomEsiClient } from '../../../../src/EsiClientBuilder';
import { identityFromToken } from '../../../../src/core/identity';
import { When } from '../../support/steps';

When('a view of the client for one identity shuts down', function () {
  const built = surfaceOf(this).built as EsiClient | CustomEsiClient;
  built.as(identityFromToken('view-token')).shutdown();
});
