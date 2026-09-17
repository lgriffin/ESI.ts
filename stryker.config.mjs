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
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
export default {
  packageManager: 'npm',
  reporters: ['html', 'json', 'clear-text', 'progress'],
  htmlReporter: { fileName: 'reports/mutation/mutation.html' },
  jsonReporter: { fileName: 'reports/mutation/mutation.json' },
  incrementalFile: 'reports/mutation/stryker-incremental.json',
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
  mutate: [
    'src/core/**/*.ts',
    '!src/core/endpoints/**',
    '!src/core/logger/ILogger.ts',
    '!src/core/cache/ICache.ts',
    '!src/core/rateLimiter/IRateLimiter.ts',
    '!src/core/IRetryStrategy.ts',
    '!src/core/circuitBreaker/ICircuitBreaker.ts',
    '!src/core/IDeduplicator.ts',
    '!src/core/requestPipeline/index.ts',
    '!src/core/requestPipeline/dependencies.ts',
  ],
  mutator: {
    excludedMutations: ['StringLiteral'],
  },
  // No global break: the gate is per directory, in mutation-thresholds.json.
  thresholds: { high: 80, low: 60, break: null },
  concurrency: 6,
  timeoutMS: 30000,
  tempDirName: '.stryker-tmp',
  cleanTempDir: true,
};
