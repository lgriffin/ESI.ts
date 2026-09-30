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
import type { World } from './world';
import { SEAM_ACCESS_TOKEN, SEAM_RETRY } from './transport';

export function buildCustomClient(
  world: World,
  clients: string[],
  clientId = 'bdd-custom-client',
): CustomEsiClient {
  const custom = new EsiClientBuilder()
    .addClients(clients as ApiClientType[])
    .withConfig({
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
      retryConfig: SEAM_RETRY,
      logLevel: 'error',
      rateLimiterConfig: { minDelayMs: 0 },
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
