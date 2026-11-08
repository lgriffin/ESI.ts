/**
 * What 0082-client-construction.feature builds and reads: the three ways to
 * build custom clients (an EsiClient, a CustomEsiClient from the builder, and
 * one domain client from EsiApiFactory.createClient), each over the transport
 * seam and logging to a recording logger, with the pieces of the pipeline
 * the construction surface built or was given.
 */
import type { ApiClient } from '../../../src/core/ApiClient';
import type { EsiClientConfig } from '../../../src/core/EsiClientConfig';
import { EsiClient } from '../../../src/EsiClient';
import {
  type CustomEsiClient,
  EsiApiFactory,
  EsiClientBuilder,
} from '../../../src/EsiClientBuilder';
import type { StatusClient } from '../../../src/clients/StatusClient';
import type { WalletClient } from '../../../src/clients/WalletClient';
import { recordingLogger, type RecordingLogger } from './logging';
import { SEAM_ACCESS_TOKEN, SEAM_RETRY } from './transport';
import type { World } from './world';

export type Surface = 'EsiClient' | 'EsiClientBuilder' | 'EsiApiFactory';

/** The pipeline settings every surface here is built with. */
function seamConfig(logger: RecordingLogger): EsiClientConfig {
  return {
    clientId: 'bdd-construction',
    baseUrl: 'https://esi.evetech.net',
    accessToken: SEAM_ACCESS_TOKEN,
    timeout: 5000,
    retryConfig: SEAM_RETRY,
    logger,
    rateLimiterConfig: { minDelayMs: 0 },
  };
}

export interface BuiltSurface {
  surface: Surface;
  /** The EsiClient, CustomEsiClient or domain client the surface built. */
  built: EsiClient | CustomEsiClient | StatusClient | WalletClient;
  getStatus(): Promise<unknown>;
  getWallet(characterId: number): Promise<unknown>;
  shutdown(): void;
  apiClient(): ApiClient;
}

/**
 * Builds `surface` over the seam with `config` on top of the seam settings.
 * A factory client is built for the domain the scenario reads: `status`
 * unless `domain` says `wallet`.
 */
export function buildSurface(
  world: World,
  surface: Surface,
  config: EsiClientConfig = {},
  domain: 'status' | 'wallet' = 'status',
): BuiltSurface {
  const logger = recordingLogger();
  world.values.constructionLogger = logger;
  const full = { ...seamConfig(logger), ...config };
  let built: BuiltSurface;
  if (surface === 'EsiClient') {
    const client = new EsiClient(full);
    built = {
      surface,
      built: client,
      getStatus: () => client.status.getStatus(),
      getWallet: (id) => client.wallet.getCharacterWallet(id),
      shutdown: () => client.shutdown(),
      apiClient: () => client['apiClient'],
    };
  } else if (surface === 'EsiClientBuilder') {
    const client = new EsiClientBuilder()
      .addClients(['status', 'wallet'])
      .withConfig(full)
      .build();
    built = {
      surface,
      built: client,
      getStatus: () => client.status!.getStatus(),
      getWallet: (id) => client.wallet!.getCharacterWallet(id),
      shutdown: () => client.shutdown(),
      apiClient: () => client['apiClient'],
    };
  } else {
    const client = EsiApiFactory.createClient(domain, full) as
      StatusClient | WalletClient;
    built = {
      surface,
      built: client,
      getStatus: () => (client as StatusClient).getStatus(),
      getWallet: (id) => (client as WalletClient).getCharacterWallet(id),
      shutdown: () => client.shutdown(),
      apiClient: () => client['_client'],
    };
  }
  world.values.surface = built;
  world.cleanups.push(() => built.shutdown());
  return built;
}

export function surfaceOf(world: World): BuiltSurface {
  const built = world.values.surface as BuiltSurface | undefined;
  if (!built) throw new Error('No client was built in this scenario');
  return built;
}

export function constructionLoggerOf(world: World): RecordingLogger {
  return world.values.constructionLogger as RecordingLogger;
}

/** The context of the line logged as `message`, or a failure naming the lines seen. */
export function loggedContext(world: World, message: string): unknown {
  const lines = constructionLoggerOf(world).lines;
  const line = lines.find((l) => l.message === message);
  if (!line) {
    throw new Error(
      `No line "${message}" among: ${lines.map((l) => l.message).join(' | ')}`,
    );
  }
  return line.context;
}

export function loggedMessages(world: World): string[] {
  return constructionLoggerOf(world).lines.map((l) => l.message);
}

/**
 * Sets an environment variable for the scenario and restores it after.
 */
export function useEnv(world: World, name: string, value: string): void {
  const before = process.env[name];
  process.env[name] = value;
  world.cleanups.push(() => {
    if (before === undefined) delete process.env[name];
    else process.env[name] = before;
  });
}

/** The endpoint a scenario records a circuit breaker failure for. */
export const CIRCUIT_ENDPOINT = '/bdd/circuit/';

/** The key a scenario holds a request in flight under. */
export const DEDUPE_KEY = 'bdd-in-flight';
