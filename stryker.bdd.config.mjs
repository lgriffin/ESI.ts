import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname);

/**
 * BDD-only mutation run: npm run mutation:bdd.
 *
 * The unit suite's mutation score says the tests notice a broken line. This
 * run asks the narrower question the specification has to answer: would any
 * scenario notice? Only tests/bdd step definitions execute, so a mutant that
 * survives here is a behaviour no Rule protects. Scores are ratcheted per
 * source directory by scripts/mutation-ratchet.ts against
 * mutation-bdd-thresholds.json.
 *
 * Sharding. Mutating all of src/ against the BDD suite in one job does not
 * finish on a hosted runner, so nightly-mutation.yml runs one job per shard in
 * mutation-bdd-shards.json and merges the reports (npm run mutation:bdd:merge)
 * before the ratchet. Set BDD_MUTATION_SHARD to a shard name to mutate that
 * shard alone and write its report to reports/mutation-bdd/shards/<name>/.
 * Unset, the config mutates everything, which is what a local run wants.
 *
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */

/**
 * Exclusions that apply to every shard alike: generated code, declarations,
 * pure type and interface modules, and barrels, none of which carry behaviour
 * a Rule could protect. Because they are shared, the union of the shards
 * mutates exactly what the unsharded run does.
 */
const COMMON_EXCLUSIONS = [
  '!src/**/*.generated.ts',
  '!src/**/*.d.ts',
  '!src/types/**',
  '!src/testing/**',
  '!src/config/**',
  '!src/**/I[A-Z]*.ts',
  '!src/**/index.ts',
  '!src/core/requestPipeline/dependencies.ts',
];

const { shards } = JSON.parse(
  readFileSync(path.join(projectRoot, 'mutation-bdd-shards.json'), 'utf8'),
);

const shardName = process.env.BDD_MUTATION_SHARD?.trim();
const shard = shardName
  ? shards.find((candidate) => candidate.name === shardName)
  : undefined;

if (shardName && !shard) {
  const names = shards.map((candidate) => candidate.name).join(', ');
  throw new Error(
    `BDD_MUTATION_SHARD=${shardName} is not a shard in mutation-bdd-shards.json (have: ${names}).`,
  );
}

/** A shard's directories as Stryker globs, most specific exclusion last. */
function mutateFor(definition) {
  if (!definition) return ['src/**/*.ts', ...COMMON_EXCLUSIONS];
  return [
    ...definition.include.map((dir) => `${dir}/**/*.ts`),
    ...(definition.exclude ?? []).map((dir) => `!${dir}/**`),
    ...COMMON_EXCLUSIONS,
  ];
}

const reportDir = shard
  ? `reports/mutation-bdd/shards/${shard.name}`
  : 'reports/mutation-bdd';

export default {
  packageManager: 'npm',
  reporters: ['html', 'json', 'clear-text', 'progress'],
  htmlReporter: { fileName: `${reportDir}/mutation.html` },
  jsonReporter: { fileName: `${reportDir}/mutation.json` },
  testRunner: 'jest',
  jest: {
    configFile: 'jest.unit.config.cjs',
    enableFindRelatedTests: true,
    config: {
      roots: ['<rootDir>/src', path.join(projectRoot, 'tests')],
      testMatch: [
        path.join(projectRoot, 'tests/bdd/step-definitions/**/*.steps.ts'),
        path.join(projectRoot, 'tests/bdd/specs/**/*.spec.ts'),
      ],
      moduleNameMapper: {
        // Optional group: a bare `../src` (package root) maps to the sandbox too.
        '^(?:\.\./)+src(/.*)?$': '<rootDir>/src$1',
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
  // No global break: the gate is per directory, in mutation-bdd-thresholds.json.
  thresholds: { high: 80, low: 60, break: null },
  concurrency: 6,
  timeoutMS: 30000,
  tempDirName: shard ? `.stryker-tmp-bdd-${shard.name}` : '.stryker-tmp-bdd',
  cleanTempDir: true,
};
