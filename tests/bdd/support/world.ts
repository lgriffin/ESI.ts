/**
 * Per-scenario state for step files written against `support/steps.ts`.
 *
 * Every scenario gets a new World, bound as `this` in its steps and hooks, so
 * nothing leaks between scenarios. A Given step records what it set up, a
 * When step records what the client returned, and a Then step reads both.
 */
import type { Esi, ScopeTree } from '../../../src/client';
import { EsiClient } from '../../../src/EsiClient';
import type { IStaticDataProvider } from '../../../src/sde/IStaticDataProvider';
import type { MockTransport } from '../../../src/testing';
import { createSeamClient } from './transport';

export class World {
  private seamClient: EsiClient | undefined;

  /**
   * The client under test: a seam client, created on first use. Assign a
   * different one in a Given step when a scenario needs its own configuration.
   */
  get client(): EsiClient {
    this.seamClient ??= createSeamClient();
    return this.seamClient;
  }

  set client(client: EsiClient) {
    this.seamClient = client;
  }

  /** The shared runtime under test (0056-shared-runtime.feature), once a Given built it. */
  esi: Esi | undefined;

  /** The mock transport under the runtime (0057-mock-transport.feature), once a Given built it. */
  transport: MockTransport | undefined;

  /** The SDE provider under test (features/sde), once a Given opened it; closed after the scenario. */
  sde: IStaticDataProvider | undefined;

  /** Views a Given step opened on the runtime, by the name the scenario uses. */
  readonly views: Record<string, ScopeTree> = {};

  /** What the scenario's action returned. */
  result: any;

  /** What the scenario's action threw, when a step captures it. */
  error: unknown;

  /**
   * Values one step fixes for a later one: the IDs a Given step queued
   * responses for, a duration a When step measured.
   */
  readonly values: Record<string, any> = {};
}
