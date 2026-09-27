/**
 * What 0057-mock-transport.feature builds and reads: a seam runtime over
 * `createMockTransport()` from the `./testing` entry, and the fixtures its
 * routes answer with.
 */
import { createMockTransport, type MockTransport } from '../../../src/testing';
import { createSeamRuntime } from './shared-runtime';
import type { World } from './world';

export const ASSET_PAGE = [{ item_id: 1, type_id: 34, quantity: 1 }];
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
