/**
 * The paged collections behind the stream and fetch-all helpers of the
 * Wallet, Mail, PI and Loyalty clients, for the paging Rules of
 * 0021-loyalty.feature, 0022-mail.feature, 0028-pi.feature and
 * 0037-wallet.feature. 0073-page-walks.feature specifies the walk itself once,
 * through the market orders; these hold each helper to it.
 *
 * Each collection is served at the seam as numbered pages, page n answering
 * only its own page number, so a page requested twice or one past the queue
 * fails the scenario. Entries carry ids that ascend in page order.
 */
import type { EsiClient } from '../../../src/EsiClient';
import type { IncompletePagesMode } from '../../../src/core/pagination/pageLimit';
import type { PageResult } from '../../../src/core/pagination/AsyncPaginationIterator';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';
import { recordingLogger, type RecordingLogger } from './logging';
import { createSeamClient, queueResponse } from './transport';
import type { World } from './world';

const CHARACTER_ID = 1689391488;
const CORPORATION_ID = 1344654522;
const DIVISION = 1;
const NPC_CORPORATION_ID = 1000035;
const LISTED_AT = '2026-09-01T00:00:00Z';

interface PagedRoute {
  /** The route's path, without the host or a trailing slash. */
  readonly resource: string;
  /** One entry of the collection, built around a unique id. */
  readonly entry: (id: number) => unknown;
}

const ROUTES = {
  'character wallet journal': {
    resource: `characters/${CHARACTER_ID}/wallet/journal`,
    entry: (id) => TestDataFactory.createWalletJournalEntry({ id }),
  },
  'character wallet transactions': {
    resource: `characters/${CHARACTER_ID}/wallet/transactions`,
    entry: (id) =>
      TestDataFactory.createWalletTransaction({ transaction_id: id }),
  },
  'corporation wallet journal': {
    resource: `corporations/${CORPORATION_ID}/wallets/${DIVISION}/journal`,
    entry: (id) => TestDataFactory.createWalletJournalEntry({ id }),
  },
  'corporation wallet transactions': {
    resource: `corporations/${CORPORATION_ID}/wallets/${DIVISION}/transactions`,
    entry: (id) =>
      TestDataFactory.createCorporationWalletTransaction({
        transaction_id: id,
      }),
  },
  'mail headers': {
    resource: `characters/${CHARACTER_ID}/mail`,
    entry: (id) => ({
      mail_id: id,
      from: 90000001,
      subject: `Message ${id}`,
      timestamp: LISTED_AT,
      is_read: false,
      labels: [1],
      recipients: [{ recipient_id: CHARACTER_ID, recipient_type: 'character' }],
    }),
  },
  'mailing lists': {
    resource: `characters/${CHARACTER_ID}/mail/lists`,
    entry: (id) => ({ mailing_list_id: id, name: `List ${id}` }),
  },
  'planetary colonies': {
    resource: `characters/${CHARACTER_ID}/planets`,
    entry: (id) => ({
      planet_id: 40000000 + id,
      planet_type: 'temperate',
      solar_system_id: 30000142,
      num_pins: 8,
      last_update: LISTED_AT,
      owner_id: CHARACTER_ID,
      upgrade_level: 5,
    }),
  },
  'customs offices': {
    resource: `corporations/${CORPORATION_ID}/customs_offices`,
    entry: (id) => ({
      office_id: 1041234567000 + id,
      system_id: 30000142,
      reinforce_exit_start: 18,
      reinforce_exit_end: 21,
      allow_alliance_access: true,
      allow_access_with_standings: false,
      corporation_tax_rate: 0.05,
    }),
  },
  'loyalty points': {
    resource: `characters/${CHARACTER_ID}/loyalty/points`,
    entry: (id) => ({
      corporation_id: 1000000 + id,
      loyalty_points: 1000 * id,
    }),
  },
  'loyalty store offers': {
    resource: `loyalty/stores/${NPC_CORPORATION_ID}/offers`,
    entry: (id) => ({
      offer_id: id,
      type_id: 17703,
      quantity: 1,
      lp_cost: 1000,
      isk_cost: 500000,
      required_items: [],
    }),
  },
} satisfies Record<string, PagedRoute>;

/** A collection a paging helper walks, by the name a scenario gives it. */
export type PagedCollection = keyof typeof ROUTES;

/** The collection a scenario names; throws on a name with no route. */
export function pagedCollection(name: string): PagedCollection {
  if (!Object.prototype.hasOwnProperty.call(ROUTES, name)) {
    throw new Error(`No paged collection named ${name}`);
  }
  return name as PagedCollection;
}

/** Entry `index` of page `page`: ids ascend in page order. */
function pagedEntry(
  collection: PagedCollection,
  page: number,
  index: number,
): unknown {
  return ROUTES[collection].entry(page * 100 + index + 1);
}

/**
 * Serves the collection as `sizes.length` pages, page n holding
 * `sizes[n - 1]` entries and answering only its own page number. Page 1
 * reports every queued page in `x-pages`.
 */
export function queuePagedCollection(
  collection: PagedCollection,
  sizes: readonly number[],
): void {
  const { resource } = ROUTES[collection];
  sizes.forEach((size, i) => {
    const page = i + 1;
    queueResponse({
      match:
        page === 1
          ? new RegExp(`/${resource}/?$`)
          : new RegExp(`/${resource}/?\\?page=${page}$`),
      headers: { 'x-pages': String(sizes.length) },
      body: Array.from({ length: size }, (_, j) =>
        pagedEntry(collection, page, j),
      ),
    });
  });
}

/** The entries of pages `from` to `to` of the served collection, in page order. */
export function entriesOfPages(
  collection: PagedCollection,
  sizes: readonly number[],
  from: number,
  to: number,
): unknown[] {
  const entries: unknown[] = [];
  for (let page = from; page <= to; page++) {
    for (let j = 0; j < sizes[page - 1]!; j++) {
      entries.push(pagedEntry(collection, page, j));
    }
  }
  return entries;
}

/** Every entry of the collection, through its client's fetch-all helper. */
export function collectEveryPage(
  client: EsiClient,
  collection: PagedCollection,
): Promise<unknown[]> {
  switch (collection) {
    case 'character wallet journal':
      return client.wallet.fetchAllCharacterWalletJournal(CHARACTER_ID);
    case 'character wallet transactions':
      return client.wallet.fetchAllCharacterWalletTransactions(CHARACTER_ID);
    case 'corporation wallet journal':
      return client.wallet.fetchAllCorporationWalletJournal(
        CORPORATION_ID,
        DIVISION,
      );
    case 'corporation wallet transactions':
      return client.wallet.fetchAllCorporationWalletTransactions(
        CORPORATION_ID,
        DIVISION,
      );
    case 'mail headers':
      return client.mail.fetchAllMailHeaders(CHARACTER_ID);
    case 'mailing lists':
      return client.mail.fetchAllMailingLists(CHARACTER_ID);
    case 'planetary colonies':
      return client.pi.fetchAllColonies(CHARACTER_ID);
    case 'customs offices':
      return client.pi.fetchAllCorporationCustomsOffices(CORPORATION_ID);
    case 'loyalty points':
      return client.loyalty.fetchAllLoyaltyPoints(CHARACTER_ID);
    case 'loyalty store offers':
      return client.loyalty.fetchAllLoyaltyStoreOffers(NPC_CORPORATION_ID);
  }
}

/** The pages of the collection, through its client's stream helper. */
function streamOf(
  client: EsiClient,
  collection: PagedCollection,
): AsyncGenerator<PageResult<unknown>, void, undefined> {
  switch (collection) {
    case 'character wallet journal':
      return client.wallet.streamCharacterWalletJournal(CHARACTER_ID);
    case 'character wallet transactions':
      return client.wallet.streamCharacterWalletTransactions(CHARACTER_ID);
    case 'corporation wallet journal':
      return client.wallet.streamCorporationWalletJournal(
        CORPORATION_ID,
        DIVISION,
      );
    case 'corporation wallet transactions':
      return client.wallet.streamCorporationWalletTransactions(
        CORPORATION_ID,
        DIVISION,
      );
    case 'mail headers':
      return client.mail.streamMailHeaders(CHARACTER_ID);
    case 'mailing lists':
      return client.mail.streamMailingLists(CHARACTER_ID);
    case 'planetary colonies':
      return client.pi.streamColonies(CHARACTER_ID);
    case 'customs offices':
      return client.pi.streamCorporationCustomsOffices(CORPORATION_ID);
    case 'loyalty points':
      return client.loyalty.streamLoyaltyPoints(CHARACTER_ID);
    case 'loyalty store offers':
      return client.loyalty.streamLoyaltyStoreOffers(NPC_CORPORATION_ID);
  }
}

/** Every entry the collection's stream helper yields, page after page. */
export async function streamEveryPage(
  client: EsiClient,
  collection: PagedCollection,
): Promise<unknown[]> {
  const entries: unknown[] = [];
  for await (const page of streamOf(client, collection)) {
    entries.push(...page.data);
  }
  return entries;
}

/** A seam client in the given incompletePages mode, logging to a recorder. */
export function incompletePagesClient(mode: IncompletePagesMode): {
  client: EsiClient;
  logger: RecordingLogger;
} {
  const logger = recordingLogger();
  return {
    client: createSeamClient({ incompletePages: mode, logger }),
    logger,
  };
}

/** The warnings a recorder received that name incompletePages. */
export function incompletePagesWarningsIn(logger: RecordingLogger) {
  return logger.lines.filter(
    (line) => line.level === 'warn' && line.message.includes('incompletePages'),
  );
}

// ── For step files: the World records which collection a scenario served

/** Serves the named collection and records it, and its page sizes, on the World. */
export function servePagedCollection(
  world: World,
  name: string,
  sizes: readonly number[],
): void {
  const collection = pagedCollection(name);
  queuePagedCollection(collection, sizes);
  world.values.pagedCollection = collection;
  world.values.pagedSizes = sizes;
}

/** The entries of pages `from` to `to` of the collection the World served. */
export function servedEntriesOfPages(
  world: World,
  from: number,
  to: number,
): unknown[] {
  return entriesOfPages(
    world.values.pagedCollection as PagedCollection,
    world.values.pagedSizes as number[],
    from,
    to,
  );
}

/** Every entry of the named collection, through the named helper. */
export function walkPagedCollection(
  client: EsiClient,
  name: string,
  helper: string,
): Promise<unknown[]> {
  const collection = pagedCollection(name);
  switch (helper) {
    case 'fetch-all':
      return collectEveryPage(client, collection);
    case 'stream':
      return streamEveryPage(client, collection);
    default:
      throw new Error(`No paging helper named ${helper}`);
  }
}
