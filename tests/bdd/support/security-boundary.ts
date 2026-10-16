/**
 * What 0062-security-boundary.feature queues, builds and reads. Each Rule
 * there holds one property of guides/SECURITY-MODEL.md against a hostile
 * input from the network; step files take the routes, payloads and archives
 * from here rather than building them inline.
 */
import AdmZip from 'adm-zip';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { EsiError, EsiPaginationError } from '../../../src/core/util/error';
import type { PageResult } from '../../../src/core/pagination/AsyncPaginationIterator';
import { SdeError } from '../../../src/sde/errors';
import { SdeExtractor } from '../../../src/sde/ingestion/SdeExtractor';
import { queueResponse, sentRequests } from './transport';
import { WALLET_CHARACTER_ID, balanceMatch } from './wallet';
import type { World } from './world';

/** The paged route the P8 scenarios walk: the alliance ID list. */
const PAGED_ROUTE_FIRST = /\/alliances\/?(\?(?!.*page=)|$)/;

/**
 * ESI reports `reported` pages for the alliance list. Only page 1 is queued:
 * a count above the 1000-page cap (security model P8) stops the walk after
 * page 1, and a client that asks for any further page finds no response,
 * which fails the scenario.
 */
export function queueReportedPageCount(header: string, reported: number): void {
  queueResponse({
    match: PAGED_ROUTE_FIRST,
    headers: { [header.toLowerCase()]: String(reported) },
    body: [1],
  });
}

/** Run a walk, keeping what it resolved with or what it threw. */
async function walk(world: World, run: () => Promise<unknown>): Promise<void> {
  try {
    world.result = await run();
  } catch (error) {
    world.error = error;
  }
}

/** Every page of the alliance list, through the domain client's plain method. */
export async function walkWithPagedMethod(world: World): Promise<void> {
  await walk(world, () => world.client.alliance.getAlliances());
}

/** Every page of the alliance list, through the collecting iterator. */
export async function walkWithCollectingIterator(world: World): Promise<void> {
  await walk(world, () => world.client.alliance.fetchAllAlliances());
}

/** Every page of the alliance list, through the async page iterator. */
export async function walkWithAsyncIterator(world: World): Promise<void> {
  await walk(world, async () => {
    const pages: PageResult<number>[] = [];
    for await (const page of world.client.alliance.streamAlliances()) {
      pages.push(page);
    }
    return pages;
  });
}

/** The walk was refused at the page cap (a reported count above 1000). */
export function expectPageCapRefusal(world: World): void {
  expect(world.error).toBeInstanceOf(EsiPaginationError);
  expect((world.error as EsiPaginationError).reason).toBe('page-cap');
}

export function pageRequestsSent(): number {
  return sentRequests().length;
}

/** ESI answers the wallet balance request with a redirect to `location`. */
export function queueWalletRedirect(location: string): void {
  queueResponse({
    match: balanceMatch(WALLET_CHARACTER_ID),
    status: 302,
    headers: { location },
    body: '',
  });
}

/** Request the wallet balance, keeping what it threw. */
export async function tryWalletBalance(world: World): Promise<void> {
  try {
    world.result =
      await world.client.wallet.getCharacterWallet(WALLET_CHARACTER_ID);
  } catch (error) {
    world.error = error;
  }
}

export function expectEsiErrorSaying(world: World, text: string): void {
  expect(world.error).toBeInstanceOf(EsiError);
  expect((world.error as EsiError).message).toContain(text);
}

/** Whether every request the client sent asked fetch not to follow redirects. */
export function everyRequestRefusesRedirects(): boolean {
  const sent = sentRequests();
  return sent.length > 0 && sent.every((r) => r.redirect !== 'follow');
}

function scenarioDir(world: World): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'esi-bdd-sec-'));
  world.cleanups.push(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/**
 * A ZIP whose entries are named by `hostile` and `benign`. adm-zip sanitises
 * a name it is asked to add, so each hostile name is written as a placeholder
 * of the same length and patched into the archive's bytes afterwards, as a
 * crafted archive from the network would carry it. Each placeholder uses its
 * own letter, so two hostile names of one length stay apart.
 */
export function writeHostileArchive(
  world: World,
  hostile: string | string[],
  benign: string,
): void {
  const root = scenarioDir(world);
  const names = Array.isArray(hostile) ? hostile : [hostile];
  const placeholders = names.map((name, i) =>
    String.fromCharCode(0x71 + i).repeat(Buffer.byteLength(name)),
  );
  const zip = new AdmZip();
  for (const placeholder of placeholders) {
    zip.addFile(placeholder, Buffer.from('escaped: true\n'));
  }
  zip.addFile(benign, Buffer.from('benign: true\n'));
  const bytes = zip.toBuffer();
  names.forEach((name, i) => {
    const from = Buffer.from(placeholders[i]!);
    const to = Buffer.from(name);
    let at = bytes.indexOf(from);
    while (at !== -1) {
      to.copy(bytes, at);
      at = bytes.indexOf(from, at + to.length);
    }
  });
  const zipPath = path.join(root, 'hostile.zip');
  fs.writeFileSync(zipPath, bytes);
  world.values.securityRoot = root;
  world.values.hostileZip = zipPath;
}

/** An empty directory inside the scenario's root, as the extraction target. */
export function emptyExtractionDirectory(world: World): void {
  const root = world.values.securityRoot as string;
  const dir = path.join(root, 'out', 'sde');
  fs.mkdirSync(dir, { recursive: true });
  world.values.extractDir = dir;
}

/** Extract the hostile archive, keeping what it threw. */
export function tryExtractHostileArchive(world: World): void {
  try {
    new SdeExtractor().extractAll(
      world.values.hostileZip as string,
      world.values.extractDir as string,
    );
  } catch (error) {
    world.error = error;
  }
}

export function expectSdeErrorSaying(world: World, text: string): void {
  expect(world.error).toBeInstanceOf(SdeError);
  expect((world.error as SdeError).message).toContain(text);
}

/** Every file under the scenario's root other than the archive itself. */
export function filesWrittenAroundExtraction(world: World): string[] {
  const root = world.values.securityRoot as string;
  const found: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (full !== world.values.hostileZip) found.push(full);
    }
  };
  walk(root);
  return found;
}
