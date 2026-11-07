/**
 * What 0070-token-storage.feature configures: a token file in a temporary
 * directory the scenario removes afterwards, written as raw JSON where a
 * scenario needs a damaged entry, and the storages read over it.
 */
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import type { StoredToken } from '../../../src/auth/types';
import { makeStoredToken } from '../step-definitions/shared/sso-helpers';
import type { World } from './world';

/** A token file path in a fresh temporary directory, removed after the scenario. */
export function tokenFilePath(world: World): string {
  const existing = world.values.tokenFile as string | undefined;
  if (existing) return existing;
  const dir = mkdtempSync(path.join(tmpdir(), 'esi-bdd-tokens-'));
  world.cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'tokens.json');
  world.values.tokenFile = file;
  return file;
}

/** A complete stored record for `characterId`, as JSON-ready data. */
export function tokenRecord(characterId: number): Record<string, unknown> {
  return { ...makeStoredToken({ characterId }) };
}

/** Writes the token file holding `entries` under their character ids. */
export function writeTokenFile(
  world: World,
  entries: Array<[string, unknown]>,
): void {
  writeFileSync(
    tokenFilePath(world),
    JSON.stringify({ version: 1, tokens: Object.fromEntries(entries) }),
  );
}

/** The ids of `tokens`, sorted. */
export function idsOf(tokens: readonly StoredToken[]): number[] {
  return tokens.map((t) => t.characterId).sort((a, b) => a - b);
}
