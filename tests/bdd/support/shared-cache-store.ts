/**
 * What 0065-shared-cache-store.feature builds: two seam EsiClients over one
 * shared cache store, each holding its own handle as a process would, and
 * the contacts exchange a write invalidates.
 */
import type { EsiClient } from '../../../src/EsiClient';
import type { CacheStore } from '../../../src/core/ports/CacheStore';
import { SharedMemoryCacheStore } from '../../tdd/helpers/SharedMemoryCacheStore';
import { CHARACTER_ID } from './shared-runtime';
import { createSeamClient, queueResponse } from './transport';
import type { World } from './world';

export const CONTACTS_PATH = /\/characters\/\d+\/contacts\/?(\?|$)/;
export const ADDED_CONTACT_ID = 2_112_625_428;
export const ADDED_STANDING = 5;

const KNOWN_CONTACT = {
  contact_id: 90_000_001,
  contact_type: 'character',
  standing: 10,
};

export const contactsBefore = () => [KNOWN_CONTACT];
export const contactsAfter = () => [
  KNOWN_CONTACT,
  {
    contact_id: ADDED_CONTACT_ID,
    contact_type: 'character',
    standing: ADDED_STANDING,
  },
];

/** A handle on the store with `publishInvalidation` and `onInvalidate` left out. */
function withoutInvalidationHooks(store: CacheStore): CacheStore {
  return {
    get: store.get,
    set: store.set,
    delete: store.delete,
    clear: store.clear,
    shutdown: store.shutdown,
  };
}

/**
 * A reader and a writer, each a seam EsiClient holding its own handle on one
 * shared store, as two processes over one Redis would. Both send the seam's
 * token, so both read the same character's entries.
 */
export function buildClientsSharingStore(
  world: World,
  options: { invalidationHooks: boolean },
): void {
  const shared = new SharedMemoryCacheStore();
  const handle = () =>
    options.invalidationHooks
      ? shared.connect()
      : withoutInvalidationHooks(shared.connect());
  for (const name of ['reader', 'writer']) {
    const client = createSeamClient({ cache: handle() });
    world.cleanups.push(() => client.shutdown());
    world.values[name] = client;
  }
}

/** The client a Given step built under `name`: the reader or the writer. */
export function sharingClientOf(world: World, name: string): EsiClient {
  const client = world.values[name] as EsiClient | undefined;
  if (!client)
    throw new Error(
      `No client "${name}": add "Given two EsiClients sharing a cache store" first`,
    );
  return client;
}

export function queueContacts(body: unknown, etag: string): void {
  queueResponse({ match: CONTACTS_PATH, body, headers: { etag } });
}

export function queueContactAdded(): void {
  queueResponse({
    match: CONTACTS_PATH,
    status: 201,
    body: [ADDED_CONTACT_ID],
  });
}

export function readContacts(client: EsiClient): Promise<unknown> {
  return client.contacts.getCharacterContacts(CHARACTER_ID);
}

export function addContact(client: EsiClient): Promise<number[]> {
  return client.contacts.postCharacterContacts(CHARACTER_ID, ADDED_STANDING, [
    ADDED_CONTACT_ID,
  ]);
}
