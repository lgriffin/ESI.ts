/**
 * What 0057-mock-transport.feature builds and reads: a seam runtime, or a
 * custom client, over `createMockTransport()` from the `./testing` entry, and
 * the fixtures its routes answer with.
 */
import { identityFromToken } from '../../../src/client';
import type { WalletClient } from '../../../src/clients/WalletClient';
import { EsiClient, type EsiClientConfig } from '../../../src/EsiClient';
import { EsiApiFactory, EsiClientBuilder } from '../../../src/EsiClientBuilder';
import { createMockTransport, type MockTransport } from '../../../src/testing';
import { createSeamRuntime, RAW_TOKEN } from './shared-runtime';
import { SEAM_RETRY } from './transport';
import type { World } from './world';

export const ASSET_PAGE = [
  {
    is_singleton: false,
    item_id: 1,
    location_flag: 'Hangar',
    location_id: 60003760,
    location_type: 'station',
    quantity: 1,
    type_id: 34,
  },
];
export const NAMES_LOOKUP_IDS = [1, 2];
export const namesOfIds = () => [
  { id: 1, name: 'Alpha', category: 'character' },
  { id: 2, name: 'Beta', category: 'corporation' },
];

/** A runtime whose requests reach a fresh mock transport, kept on the World. */
export function createMockRuntime(world: World): MockTransport {
  const transport = createMockTransport();
  world.transport = transport;
  world.esi = createSeamRuntime({ transport });
  return transport;
}

/** The mock transport a Given step built, or a failure naming the missing step. */
export function transportOf(world: World): MockTransport {
  if (!world.transport)
    throw new Error(
      'No mock transport: add "Given a runtime over a mock transport" first',
    );
  return world.transport;
}

/** The description the transport records a request under. */
export function describeRequest(method: string, url: string): string {
  return `${method} ${url}`;
}

/** The seam settings the custom clients in these scenarios share. */
const CUSTOM_SEAM_CONFIG = {
  baseUrl: 'https://esi.evetech.net',
  timeout: 5000,
  retryConfig: SEAM_RETRY,
  logLevel: 'error',
  rateLimiterConfig: { minDelayMs: 0 },
} as const satisfies EsiClientConfig;

/**
 * A custom client, built by `surface`, whose requests reach a fresh mock
 * transport rather than the seam: a request that reached the seam would fail
 * the scenario as unexpected. The client is kept on the World as
 * `values.walletClient`, and shut down after the scenario.
 */
export function createMockCustomClient(
  world: World,
  surface: 'EsiClient' | 'EsiClientBuilder' | 'EsiApiFactory',
): MockTransport {
  const transport = createMockTransport();
  world.transport = transport;
  const config: EsiClientConfig = { ...CUSTOM_SEAM_CONFIG, transport };
  let wallet: WalletClient;
  let shutdown: () => void;
  if (surface === 'EsiClient') {
    const client = new EsiClient(config);
    world.values.esiClient = client;
    wallet = client.as(identityFromToken(RAW_TOKEN)).wallet;
    shutdown = () => client.shutdown();
  } else if (surface === 'EsiClientBuilder') {
    const custom = new EsiClientBuilder()
      .addClients(['wallet'])
      .withConfig(config)
      .withAccessToken(RAW_TOKEN)
      .build();
    wallet = custom.wallet!;
    shutdown = () => custom.shutdown();
  } else {
    wallet = EsiApiFactory.createClient('wallet', {
      ...config,
      accessToken: RAW_TOKEN,
    }) as WalletClient;
    shutdown = () => wallet.shutdown();
  }
  world.values.walletClient = wallet;
  world.cleanups.push(shutdown);
  return transport;
}

/** The wallet client a "custom client over a mock transport" Given step built. */
export function walletClientOf(world: World): WalletClient {
  const client = world.values.walletClient as WalletClient | undefined;
  if (!client)
    throw new Error(
      'No wallet client: add a "... over a mock transport" Given step for a custom client first',
    );
  return client;
}
