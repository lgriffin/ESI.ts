import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname);

/**
 * Unit-suite mutation run.
 *
 * - Nightly (nightly-mutation.yml): every file in `mutate`, with --incremental
 *   --force so the run is complete and also writes the incremental file that
 *   pull requests restore from the Actions cache.
 * - Pull requests (npm run mutation:pr): scripts/mutation-pr.ts narrows
 *   `mutate` to the changed files and reuses the nightly results for the rest.
 *
 * Scores are gated per directory by scripts/mutation-ratchet-core.ts against
 * mutation-thresholds.json, not by a global break threshold.
 *
 * Sharding. One job over all of src/core stopped finishing inside its
 * 240-minute timeout as the unit suite grew, and a nightly that never
 * completes never saves the incremental baseline pull requests restore. Set
 * UNIT_MUTATION_SHARD to a name in mutation-unit-shards.json to mutate that
 * shard alone, writing its report and its own incremental file under
 * reports/mutation/shards/<name>/. Unset, the config mutates everything, which
 * is what a local run wants.
 *
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */

/** Shared by every shard, so their union is what the unsharded glob covered. */
const COMMON_EXCLUSIONS = [
  '!src/core/endpoints/**',
  // Ports are interfaces only: no runtime code, so no mutants to score.
  '!src/core/ports/**',
  '!src/core/logger/ILogger.ts',
  '!src/core/cache/ICache.ts',
  '!src/core/rateLimiter/IRateLimiter.ts',
  '!src/core/IRetryStrategy.ts',
  '!src/core/circuitBreaker/ICircuitBreaker.ts',
  '!src/core/IDeduplicator.ts',
  '!src/core/requestPipeline/index.ts',
  '!src/core/requestPipeline/dependencies.ts',
];

const { shards } = JSON.parse(
  readFileSync(path.join(projectRoot, 'mutation-unit-shards.json'), 'utf8'),
);

const shardName = process.env.UNIT_MUTATION_SHARD?.trim();
const shard = shardName
  ? shards.find((candidate) => candidate.name === shardName)
  : undefined;

if (shardName && !shard) {
  const names = shards.map((candidate) => candidate.name).join(', ');
  throw new Error(
    `UNIT_MUTATION_SHARD=${shardName} is not a shard in mutation-unit-shards.json (have: ${names}).`,
  );
}

/** A shard's directories as Stryker globs, most specific exclusion last. */
function mutateFor(definition) {
  if (!definition) return ['src/core/**/*.ts', ...COMMON_EXCLUSIONS];
  return [
    ...definition.include.map((dir) => `${dir}/**/*.ts`),
    ...(definition.exclude ?? []).map((dir) => `!${dir}/**`),
    ...COMMON_EXCLUSIONS,
  ];
}

const reportDir = shard
  ? `reports/mutation/shards/${shard.name}`
  : 'reports/mutation';
export default {
  packageManager: 'npm',
  reporters: ['html', 'json', 'clear-text', 'progress'],
  htmlReporter: { fileName: `${reportDir}/mutation.html` },
  jsonReporter: { fileName: `${reportDir}/mutation.json` },
  incrementalFile: `${reportDir}/stryker-incremental.json`,
  testRunner: 'jest',
  jest: {
    configFile: 'jest.unit.config.cjs',
    enableFindRelatedTests: true,
    config: {
      roots: ['<rootDir>/src', path.join(projectRoot, 'tests')],
      testMatch: [path.join(projectRoot, 'tests/tdd/**/*.test.ts')],
      // Relative imports of src/ from tests/ resolve to the sandbox copy. The
      // optional group also catches a bare `../../../src` (the package root),
      // which otherwise loaded the unmutated tree and failed the identity
      // checks in tests/tdd/auth/index.test.ts during the dry run.
      moduleNameMapper: {
        '^(?:\\.\\./)+src(/.*)?$': '<rootDir>/src$1',
      },
    },
  },
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',
  coverageAnalysis: 'perTest',
  ignoreStatic: true,
  mutate: mutateFor(shard),
  mutator: {
    excludedMutations: ['StringLiteral'],
  },
  // No global break: the gate is per directory, in mutation-thresholds.json.
  thresholds: { high: 80, low: 60, break: null },
  concurrency: 6,
  timeoutMS: 30000,
  tempDirName: shard ? `.stryker-tmp-${shard.name}` : '.stryker-tmp',
  cleanTempDir: true,
};
