/**
 * Self-tests for the unit-suite mutation shards (config/mutation/unit-shards.json).
 *
 * Same contract as the BDD shards, over a smaller tree: the shards must
 * partition the directories the unit run mutates, `src/core` and `src/sde`
 * (Track S Run 2), because a file claimed by no shard is never mutated
 * and its directory's score silently improves, while a file claimed by two is
 * counted twice. `scripts/mutation/mutation-merge-core.ts` holds the logic and
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
  baselineShardFor,
  parseShards,
  shardsClaiming,
} from '../../../scripts/mutation/mutation-merge-core';

const ROOT = path.resolve(__dirname, '../../..');
const SHARDS_FILE = 'config/mutation/unit-shards.json';

const shards = parseShards(
  readFileSync(path.join(ROOT, SHARDS_FILE), 'utf8'),
  SHARDS_FILE,
);

/** The directories the unit run mutates (config/mutation/stryker.config.mjs, unsharded). */
const MUTATED = ['src/core', 'src/sde'];

/** Every TypeScript file under a directory, repo-relative with forward slashes. */
function filesUnder(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(path.join(ROOT, dir), {
    withFileTypes: true,
  })) {
    const child = `${dir}/${entry.name}`;
    if (entry.isDirectory()) found.push(...filesUnder(child));
    else if (entry.name.endsWith('.ts')) found.push(child);
  }
  return found;
}

const mutatedFiles = MUTATED.flatMap(filesUnder);

describe('the unit shards partition the directories the unit run mutates', () => {
  it('finds the trees it is meant to check', () => {
    // A rename that emptied this walk would make every case below vacuous.
    expect(filesUnder('src/core').length).toBeGreaterThan(40);
    expect(filesUnder('src/sde').length).toBeGreaterThan(10);
  });

  it.each(mutatedFiles)('%s belongs to exactly one shard', (file) => {
    expect(shardsClaiming(file, shards)).toHaveLength(1);
  });

  it('gives the SDE its own shard, ingestion included', () => {
    expect(
      shardsClaiming('src/sde/providers/yaml/SdeDataProvider.ts', shards),
    ).toEqual(['sde']);
    expect(
      shardsClaiming('src/sde/ingestion/SdeDatabaseBuilder.ts', shards),
    ).toEqual(['sde']);
  });

  it('claims nothing outside those directories', () => {
    expect(shardsClaiming('src/clients/MarketClient.ts', shards)).toEqual([]);
    expect(shardsClaiming('src/schemas/market.ts', shards)).toEqual([]);
    expect(shardsClaiming('src/auth/EveSsoClient.ts', shards)).toEqual([]);
  });

  it('still claims the directories the mutate globs exclude', () => {
    // src/core/endpoints contributes no mutants, because config/mutation/stryker.config.mjs
    // excludes it. It is claimed anyway: a partition with a hole in it is not
    // a partition, and the hole is where a future directory goes unnoticed.
    expect(
      shardsClaiming('src/core/endpoints/MarketEndpoints.ts', shards),
    ).toEqual(['core-root']);
  });
});

describe('the unit shard list agrees with the scored directories', () => {
  const thresholds = JSON.parse(
    readFileSync(
      path.join(ROOT, 'config/mutation/unit-thresholds.json'),
      'utf8',
    ),
  ) as Record<string, number>;

  it.each(Object.keys(thresholds))('%s is covered by a shard', (directory) => {
    // Every directory the ratchet scores has to be mutated by some shard, or
    // the merged report would be missing it and the ratchet would fail on a
    // directory nobody ran rather than on a directory that got worse.
    expect(shardsClaiming(`${directory}/probe.ts`, shards)).toHaveLength(1);
  });
});

describe('which nightly shard a pull request run restores (esi-23g.55)', () => {
  it('restores the one shard that claims every file to mutate', () => {
    expect(
      baselineShardFor(
        ['src/core/cache/ETagCacheManager.ts', 'src/core/cache/cacheKey.ts'],
        shards,
      ),
    ).toEqual({
      shard: 'core-cache',
      reason: 'every file to mutate is in shard core-cache.',
    });
  });

  it('restores a shard that owns several directories when the change spans them', () => {
    // core-backoff owns both rateLimiter and circuitBreaker: one baseline
    // covers a change to both.
    expect(
      baselineShardFor(
        [
          'src/core/rateLimiter/RateLimiter.ts',
          'src/core/circuitBreaker/CircuitBreaker.ts',
        ],
        shards,
      ).shard,
    ).toBe('core-backoff');
  });

  it('tells a file directly in src/core from one in a subdirectory', () => {
    expect(baselineShardFor(['src/core/RetryStrategy.ts'], shards).shard).toBe(
      'core-root',
    );
  });

  it('runs cold when the change spans shards, naming them', () => {
    expect(
      baselineShardFor(
        ['src/core/RetryStrategy.ts', 'src/core/cache/cacheKey.ts'],
        shards,
      ),
    ).toEqual({
      shard: null,
      reason:
        "the change spans shards core-cache, core-root, and one shard's baseline cannot vouch for another's files; running cold.",
    });
  });

  it('runs cold when a file belongs to no shard', () => {
    expect(baselineShardFor(['src/clients/MarketClient.ts'], shards)).toEqual({
      shard: null,
      reason: 'src/clients/MarketClient.ts belongs to no shard; running cold.',
    });
  });

  it('runs cold, rather than guessing, when a file is claimed twice', () => {
    const overlapping = [
      { name: 'a', include: ['src/core'] },
      { name: 'b', include: ['src/core/cache'] },
    ];
    expect(baselineShardFor(['src\\core\\cache\\x.ts'], overlapping)).toEqual({
      shard: null,
      reason: 'src/core/cache/x.ts belongs to shards a, b; running cold.',
    });
  });

  it('needs no baseline when there is nothing to mutate', () => {
    expect(baselineShardFor([], shards).shard).toBeNull();
  });
});
