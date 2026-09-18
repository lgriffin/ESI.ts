/**
 * npm run mutation:bdd:merge [-- --shard-dir <dir>] [-- --out <file>]
 *
 * Merges the per-shard Stryker reports the BDD mutation matrix produced into
 * the single report the ratchet reads (npm run mutation:bdd:ratchet).
 *
 * Reads  reports/mutation-bdd/shards/<shard>/mutation.json, one per shard in
 * mutation-bdd-shards.json, and writes reports/mutation-bdd/mutation.json.
 * A missing shard, an empty shard or two shards claiming one file is a hard
 * failure: see scripts/mutation-merge-core.ts for why each one has to be.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';

import {
  MutationMergeError,
  ShardReport,
  mergeShardReports,
  parseShards,
} from './mutation-merge-core';
import type { MutationReport } from './mutation-ratchet-core';

const ROOT = path.resolve(__dirname, '..');
const SHARDS_FILE = 'mutation-bdd-shards.json';

function flag(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith('--')) {
    console.error(`--${name} needs a value.`);
    process.exit(2);
  }
  return value;
}

function main(): void {
  const shardDir = flag('shard-dir', 'reports/mutation-bdd/shards');
  const out = flag('out', 'reports/mutation-bdd/mutation.json');

  const shardsPath = path.join(ROOT, SHARDS_FILE);
  if (!existsSync(shardsPath)) {
    console.error(`No ${SHARDS_FILE}; failing closed.`);
    process.exit(1);
  }
  const shards = parseShards(readFileSync(shardsPath, 'utf8'), SHARDS_FILE);

  const reports: ShardReport[] = [];
  for (const shard of shards) {
    const file = path.resolve(ROOT, shardDir, shard.name, 'mutation.json');
    if (!existsSync(file)) continue; // mergeShardReports names what is missing
    reports.push({
      name: shard.name,
      report: JSON.parse(readFileSync(file, 'utf8')) as MutationReport,
    });
  }

  const { report, fileCounts } = mergeShardReports(shards, reports);

  const outPath = path.resolve(ROOT, out);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(report));

  const total = Object.values(fileCounts).reduce((sum, n) => sum + n, 0);
  for (const shard of shards) {
    console.log(`  ${shard.name.padEnd(16)} ${fileCounts[shard.name]} files`);
  }
  console.log(
    `\nMerged ${shards.length} shards, ${total} mutated files, into ${out}.`,
  );
}

try {
  main();
} catch (err) {
  if (err instanceof MutationMergeError) {
    console.error(err.message);
    process.exit(1);
  }
  throw err;
}
