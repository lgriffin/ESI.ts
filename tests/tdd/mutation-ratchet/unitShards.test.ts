/**
 * Self-tests for the unit-suite mutation shards (mutation-unit-shards.json).
 *
 * Same contract as the BDD shards, over a smaller tree: the shards must
 * partition `src/core`, because a file claimed by no shard is never mutated
 * and its directory's score silently improves, while a file claimed by two is
 * counted twice. `scripts/mutation-merge-core.ts` holds the logic and
 * `bddShards.test.ts` covers its behaviour in detail; this file pins the unit
 * shard list itself.
 *
 * Why the unit run is sharded at all: one job over all of `src/core` took
 * almost exactly two hours on 14, 15 and 16 September 2026 and then stopped
 * finishing inside its 240-minute timeout as the suite grew past 6,000 tests.
 * A nightly that never completes never writes the incremental baseline the
 * pull request gate restores, so that gate mutated everything from scratch and
 * timed out too (esi-23g.52).
 */
import { readFileSync, readdirSync } from 'fs';
import * as path from 'path';

import {
  parseShards,
  shardsClaiming,
} from '../../../scripts/mutation-merge-core';

const ROOT = path.resolve(__dirname, '../../..');
const SHARDS_FILE = 'mutation-unit-shards.json';

const shards = parseShards(
  readFileSync(path.join(ROOT, SHARDS_FILE), 'utf8'),
  SHARDS_FILE,
);

/** Every TypeScript file under src/core, repo-relative with forward slashes. */
function coreFiles(dir = 'src/core'): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(path.join(ROOT, dir), {
    withFileTypes: true,
  })) {
    const child = `${dir}/${entry.name}`;
    if (entry.isDirectory()) found.push(...coreFiles(child));
    else if (entry.name.endsWith('.ts')) found.push(child);
  }
  return found;
}

describe('the unit shards partition src/core', () => {
  const files = coreFiles();

  it('finds the tree it is meant to check', () => {
    // A rename that emptied this walk would make every case below vacuous.
    expect(files.length).toBeGreaterThan(40);
  });

  it.each(coreFiles())('%s belongs to exactly one shard', (file) => {
    expect(shardsClaiming(file, shards)).toHaveLength(1);
  });

  it('claims nothing outside src/core', () => {
    expect(shardsClaiming('src/clients/MarketClient.ts', shards)).toEqual([]);
    expect(shardsClaiming('src/schemas/market.ts', shards)).toEqual([]);
  });

  it('still claims the directories the mutate globs exclude', () => {
    // src/core/endpoints contributes no mutants, because stryker.config.mjs
    // excludes it. It is claimed anyway: a partition with a hole in it is not
    // a partition, and the hole is where a future directory goes unnoticed.
    expect(
      shardsClaiming('src/core/endpoints/MarketEndpoints.ts', shards),
    ).toEqual(['core-root']);
  });
});

describe('the unit shard list agrees with the scored directories', () => {
  const thresholds = JSON.parse(
    readFileSync(path.join(ROOT, 'mutation-thresholds.json'), 'utf8'),
  ) as Record<string, number>;

  it.each(Object.keys(thresholds))('%s is covered by a shard', (directory) => {
    // Every directory the ratchet scores has to be mutated by some shard, or
    // the merged report would be missing it and the ratchet would fail on a
    // directory nobody ran rather than on a directory that got worse.
    expect(shardsClaiming(`${directory}/probe.ts`, shards)).toHaveLength(1);
  });
});
