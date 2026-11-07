/**
 * What 0069-sso-client.feature configures: an EveSsoClient for the test
 * application, answered at the transport seam or, where a scenario needs a
 * fetch that misbehaves, through a fetch of its own.
 */
import {
  EveSsoClient,
  type EveSsoClientConfig,
} from '../../../src/auth/EveSsoClient';
import type { World } from './world';

export const SSO_CLIENT_ID = 'test-client-id';

/** Builds the scenario's SSO client; `config` overrides the defaults. */
export function ssoClient(
  world: World,
  config: Partial<EveSsoClientConfig> = {},
): EveSsoClient {
  const client = new EveSsoClient({
    clientId: SSO_CLIENT_ID,
    clientSecret: 'test-client-secret',
    callbackUrl: 'https://app.example/callback',
    ...config,
  });
  world.values.ssoClient = client;
  return client;
}

/** The scenario's SSO client, built by a Given step. */
export function theSsoClient(world: World): EveSsoClient {
  return world.values.ssoClient as EveSsoClient;
}
