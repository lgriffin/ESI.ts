/**
 * Custom clients for 0060-custom-client.feature: built through the real
 * EsiClientBuilder with the seam's own settings, so requests reach the
 * transport seam like EsiClient's do.
 */
import {
  CustomEsiClient,
  EsiClientBuilder,
  type ApiClientType,
} from '../../../src/EsiClientBuilder';
import type { EsiClientConfig } from '../../../src/EsiClient';
import type { DeprecationInfo } from '../../../src/core/endpoints/EndpointDefinition';
import { statusEndpoints } from '../../../src/core/endpoints/statusEndpoints';
import type { World } from './world';
import { SEAM_ACCESS_TOKEN, SEAM_RETRY } from './transport';

export function buildCustomClient(
  world: World,
  clients: string[],
  clientId = 'bdd-custom-client',
  config: EsiClientConfig = {},
): CustomEsiClient {
  const custom = new EsiClientBuilder()
    .addClients(clients as ApiClientType[])
    .withConfig({
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
      retryConfig: SEAM_RETRY,
      logLevel: 'error',
      rateLimiterConfig: { minDelayMs: 0 },
      ...config,
    })
    .withClientId(clientId)
    .withAccessToken(SEAM_ACCESS_TOKEN)
    .build();
  world.cleanups.push(() => custom.shutdown());
  world.values.customClient = custom;
  return custom;
}

export function customClientOf(world: World): CustomEsiClient {
  const custom = world.values.customClient as CustomEsiClient | undefined;
  if (!custom) throw new Error('No custom client was built in this scenario');
  return custom;
}

/** What the deprecation scenario adds to the server status endpoint. */
export const STATUS_ENDPOINT_DEPRECATION = {
  message: 'Read the route status instead.',
  replacedBy: 'meta.getStatus',
  sunsetDate: '2027-01-01',
} as const;

/**
 * Marks the server status endpoint definition deprecated, as a maintainer
 * would once the spec deprecates its operation, and returns the undo. The
 * definition object is the one the status client's methods read on every
 * call, so the real pipeline sees the change.
 */
export function markStatusEndpointDeprecated(): () => void {
  const def = statusEndpoints.getStatus as { deprecated?: DeprecationInfo };
  def.deprecated = { ...STATUS_ENDPOINT_DEPRECATION };
  return () => {
    delete def.deprecated;
  };
}
