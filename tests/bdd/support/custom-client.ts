/**
 * Custom clients for 0060-custom-client.feature and the public-only ones for
 * 0064-public-custom-client.feature: built through the real EsiClientBuilder
 * with the seam's own settings, so requests reach the transport seam like
 * EsiClient's do.
 */
import {
  CustomEsiClient,
  EsiClientBuilder,
  type ApiClientType,
  type PublicCustomEsiClient,
} from '../../../src/EsiClientBuilder';
import type { EsiClientConfig } from '../../../src/EsiClient';
import type { RequestInterceptor } from '../../../src/core/middleware/Middleware';
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
  const custom = seamBuilder(clients, config, clientId)
    .withAccessToken(SEAM_ACCESS_TOKEN)
    .build();
  world.cleanups.push(() => custom.shutdown());
  world.values.customClient = custom;
  return custom;
}

/** A builder with the seam's settings and no token. */
function seamBuilder(
  clients: string[],
  config: EsiClientConfig,
  clientId: string,
): EsiClientBuilder {
  return new EsiClientBuilder()
    .addClients(clients as ApiClientType[])
    .withConfig({
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
      retryConfig: SEAM_RETRY,
      logLevel: 'error',
      rateLimiterConfig: { minDelayMs: 0 },
      ...config,
    })
    .withClientId(clientId);
}

/**
 * A public custom client from `buildPublic()`. `withToken` also hands the
 * builder the seam's access token first, as a caller who reused a configured
 * builder would.
 */
export function buildPublicCustomClient(
  world: World,
  clients: string[],
  options: { config?: EsiClientConfig; withToken?: boolean } = {},
): PublicCustomEsiClient {
  const builder = seamBuilder(
    clients,
    options.config ?? {},
    'bdd-public-custom-client',
  );
  if (options.withToken) builder.withAccessToken(SEAM_ACCESS_TOKEN);
  const custom = builder.buildPublic();
  world.cleanups.push(() => custom.shutdown());
  world.values.publicCustomClient = custom;
  return custom;
}

export function publicCustomClientOf(world: World): PublicCustomEsiClient {
  const custom = world.values.publicCustomClient as
    PublicCustomEsiClient | undefined;
  if (!custom)
    throw new Error('No public custom client was built in this scenario');
  return custom;
}

/** A request interceptor that puts a bearer on every request, as an auth middleware would. */
export const addBearerInterceptor: RequestInterceptor = (context) => ({
  ...context,
  headers: { ...context.headers, Authorization: 'Bearer interceptor-token' },
});

/**
 * Sets ESI_ACCESS_TOKEN and returns the cleanup that puts back whatever the
 * process had before.
 */
export function withAccessTokenEnv(value: string): () => void {
  const had = Object.hasOwn(process.env, 'ESI_ACCESS_TOKEN');
  const previous = process.env.ESI_ACCESS_TOKEN;
  process.env.ESI_ACCESS_TOKEN = value;
  return () => {
    if (had) process.env.ESI_ACCESS_TOKEN = previous;
    else delete process.env.ESI_ACCESS_TOKEN;
  };
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
