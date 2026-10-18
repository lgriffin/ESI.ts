/**
 * What 0063-custom-client-identity-views.feature builds: an EsiClient at the
 * seam and the identity views it hands out with `as(identity)`.
 */
import type { EsiClient } from '../../../src/EsiClient';
import type { CustomEsiClient } from '../../../src/EsiClientBuilder';
import { createSeamClient } from './transport';
import type { World } from './world';

/** A seam EsiClient with no token of its own: every bearer comes from a view. */
export function buildSeamEsiClient(world: World): EsiClient {
  const client = createSeamClient({ accessToken: undefined });
  world.cleanups.push(() => client.shutdown());
  world.values.esiClient = client;
  return client;
}

export function esiClientOf(world: World): EsiClient {
  const client = world.values.esiClient as EsiClient | undefined;
  if (!client)
    throw new Error(
      'No EsiClient: add "Given an EsiClient that holds no token" first',
    );
  return client;
}

/** The identity view a Given step opened, under its name. */
export function viewOf(world: World, name = 'view'): EsiClient {
  const view = world.values[name] as EsiClient | undefined;
  if (!view)
    throw new Error(`No identity view "${name}": add a Given that opens one`);
  return view;
}

export function customViewOf(world: World): CustomEsiClient {
  const view = world.values.customView as CustomEsiClient | undefined;
  if (!view)
    throw new Error('No identity view of the custom client was opened');
  return view;
}
