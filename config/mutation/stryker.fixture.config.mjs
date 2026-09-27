/**
 * Negative fixture for the mutation tier: npm run mutation:fixture.
 *
 * Mutates the known-weak tests/mutation-fixture/weakClamp.ts with only its
 * fixture test. scripts/mutation-fixture.ts then asserts some mutants were
 * killed and some survived, and that the ratchet fails the survivors. It runs
 * before the pull request mutation job, so the job proves it can go red.
 *
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
export default {
  packageManager: 'npm',
  reporters: ['json', 'clear-text'],
  jsonReporter: { fileName: 'reports/mutation-fixture/mutation.json' },
  testRunner: 'jest',
  jest: {
    projectType: 'custom',
    enableFindRelatedTests: false,
    config: {
      testEnvironment: 'node',
      roots: ['<rootDir>/tests/mutation-fixture'],
      testMatch: ['**/*.fixture.ts'],
      moduleFileExtensions: ['ts', 'js', 'json'],
      transform: {
        '^.+\\.ts$': [
          'ts-jest',
          { tsconfig: 'tsconfig.test.json', diagnostics: false },
        ],
      },
    },
  },
  coverageAnalysis: 'perTest',
  mutate: ['tests/mutation-fixture/weakClamp.ts'],
  mutator: {
    excludedMutations: ['StringLiteral'],
  },
  thresholds: { high: 80, low: 60, break: null },
  concurrency: 2,
  timeoutMS: 30000,
  tempDirName: '.stryker-tmp-fixture',
  cleanTempDir: true,
};
