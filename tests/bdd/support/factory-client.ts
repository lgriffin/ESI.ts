/** The domain client a 0060-custom-client.feature step built with EsiApiFactory. */
import type { StatusClient } from '../../../src/clients/StatusClient';
import type { World } from './world';

export function factoryClientOf(world: World): StatusClient {
  const client = world.values.factoryClient as StatusClient | undefined;
  if (!client)
    throw new Error(
      'No factory client: add "Given a "status" client built by EsiApiFactory.createClient" first',
    );
  return client;
}
