/**
 * Self-tests for the BDD mutation shards (mutation-bdd-shards.json,
 * scripts/mutation-merge-core.ts).
 *
 * Splitting the BDD mutation run across jobs buys a run that finishes and
 * costs the guarantee the unsharded run gave for free: that the report the
 * ratchet scores covers every file. Two things have to hold for the split to
 * be safe, and each test here is a way one of them could quietly stop
 * holding.
 *
 * 1. The shards partition src/. A file claimed by no shard is never mutated
 *    and its directory's score silently improves; a file claimed by two is
 *    counted twice.
 * 2. The merge refuses an incomplete run. A shard whose job died would
 *    otherwise leave its directories scored on nothing, which reads as a
 *    passing ratchet.
 */
import { readFileSync, readdirSync } from 'fs';
import * as path from 'path';

import {
  MutationMergeError,
  ShardDefinition,
  ShardReport,
  mergeShardReports,
  parseShards,
  shardsClaiming,
} from '../../../scripts/mutation-merge-core';
import type { MutationReport } from '../../../scripts/mutation-ratchet-core';

const ROOT = path.resolve(__dirname, '../../..');
const SHARDS_FILE = 'mutation-bdd-shards.json';

const shards = parseShards(
  readFileSync(path.join(ROOT, SHARDS_FILE), 'utf8'),
  SHARDS_FILE,
);

/** Every TypeScript file under src/, repo-relative with forward slashes. */
function sourceFiles(dir = 'src'): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(path.join(ROOT, dir), {
    withFileTypes: true,
  })) {
    const child = `${dir}/${entry.name}`;
    if (entry.isDirectory()) found.push(...sourceFiles(child));
    else if (entry.name.endsWith('.ts')) found.push(child);
  }
  return found;
}

function report(files: string[]): MutationReport {
  return {
    files: Object.fromEntries(
      files.map((file) => [file, { mutants: [{ status: 'Killed' as const }] }]),
    ),
  };
}

function reportsFor(
  names: string[],
  files: Record<string, string[]>,
): ShardReport[] {
  return names.map((name) => ({ name, report: report(files[name]) }));
}

describe('the shards partition src/', () => {
  const files = sourceFiles();

  it('finds the source tree it is meant to check', () => {
    // A rename that emptied this walk would make every case below vacuous.
    expect(files.length).toBeGreaterThan(100);
  });

  it.each(sourceFiles())('%s belongs to exactly one shard', (file) => {
    expect(shardsClaiming(file, shards)).toHaveLength(1);
  });

  it('claims a file in no shard for nobody', () => {
    expect(shardsClaiming('scripts/spec-audit.ts', shards)).toEqual([]);
  });

  it('reports both owners when two shards overlap', () => {
    const overlapping: ShardDefinition[] = [
      { name: 'a', include: ['src/core'] },
      { name: 'b', include: ['src/core/cache'] },
    ];
    expect(
      shardsClaiming('src/core/cache/ETagCacheManager.ts', overlapping),
    ).toEqual(['a', 'b']);
  });

  it('does not let a prefix of a directory name claim its sibling', () => {
    const near: ShardDefinition[] = [{ name: 'a', include: ['src/core'] }];
    expect(shardsClaiming('src/coreutils/thing.ts', near)).toEqual([]);
  });
});

describe('parseShards', () => {
  it('rejects a file that is not JSON', () => {
    expect(() => parseShards('{', SHARDS_FILE)).toThrow(MutationMergeError);
  });

  it('rejects an empty shard list, which would mutate nothing', () => {
    expect(() => parseShards('{"shards":[]}', SHARDS_FILE)).toThrow(
      /at least one shard/,
    );
  });

  it('rejects a shard with no directories', () => {
    expect(() =>
      parseShards('{"shards":[{"name":"a","include":[]}]}', SHARDS_FILE),
    ).toThrow(/includes no directories/);
  });

  it('rejects a repeated shard name, which the matrix would run once', () => {
    expect(() =>
      parseShards(
        '{"shards":[{"name":"a","include":["src"]},{"name":"a","include":["src"]}]}',
        SHARDS_FILE,
      ),
    ).toThrow(/names the shard a twice/);
  });
});

describe('mergeShardReports', () => {
  const two: ShardDefinition[] = [
    { name: 'a', include: ['src/core'] },
    { name: 'b', include: ['src/clients'] },
  ];
  const files = {
    a: ['src/core/ApiClient.ts'],
    b: ['src/clients/MarketClient.ts'],
  };

  it('puts each shard file into one report', () => {
    const { report: merged, fileCounts } = mergeShardReports(
      two,
      reportsFor(['a', 'b'], files),
    );
    expect(Object.keys(merged.files).sort()).toEqual([
      'src/clients/MarketClient.ts',
      'src/core/ApiClient.ts',
    ]);
    expect(fileCounts).toEqual({ a: 1, b: 1 });
  });

  it('normalises Windows paths so one file is not two entries', () => {
    const { report: merged } = mergeShardReports(two, [
      { name: 'a', report: report(['src\\core\\ApiClient.ts']) },
      { name: 'b', report: report(['src/clients/MarketClient.ts']) },
    ]);
    expect(Object.keys(merged.files)).toContain('src/core/ApiClient.ts');
  });

  it('refuses a run with a shard missing, rather than scoring on part of it', () => {
    expect(() => mergeShardReports(two, reportsFor(['a'], files))).toThrow(
      /No report for shard b/,
    );
  });

  it('refuses a shard that mutated nothing', () => {
    expect(() =>
      mergeShardReports(two, [
        { name: 'a', report: report([]) },
        { name: 'b', report: report(files.b) },
      ]),
    ).toThrow(/Shard a reported no mutated files/);
  });

  it('refuses two shards that report the same file', () => {
    expect(() =>
      mergeShardReports(two, [
        { name: 'a', report: report(['src/core/ApiClient.ts']) },
        { name: 'b', report: report(['src/core/ApiClient.ts']) },
      ]),
    ).toThrow(/mutated by both a and b/);
  });

  it('refuses a report from a shard nothing defines', () => {
    expect(() =>
      mergeShardReports(two, [
        ...reportsFor(['a', 'b'], files),
        { name: 'ghost', report: report(['src/auth/EveSsoClient.ts']) },
      ]),
    ).toThrow(/unknown shard ghost/);
  });

  it('keeps the rest of the report so the merged file stays a Stryker report', () => {
    const withMeta = {
      schemaVersion: '1.0',
      thresholds: { high: 80, low: 60 },
      files: report(files.a).files,
    } as unknown as MutationReport;
    const { report: merged } = mergeShardReports(two, [
      { name: 'a', report: withMeta },
      { name: 'b', report: report(files.b) },
    ]);
    expect(merged).toMatchObject({ schemaVersion: '1.0' });
  });
});
