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
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
export default {
  packageManager: 'npm',
  reporters: ['html', 'json', 'clear-text', 'progress'],
  htmlReporter: { fileName: 'reports/mutation-bdd/mutation.html' },
  jsonReporter: { fileName: 'reports/mutation-bdd/mutation.json' },
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
        '^(?:\\.\\./)+src(/.*)?$': '<rootDir>/src$1',
      },
    },
  },
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',
  coverageAnalysis: 'perTest',
  ignoreStatic: true,
  mutate: [
    'src/**/*.ts',
    '!src/**/*.generated.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
    '!src/testing/**',
    '!src/config/**',
    '!src/**/I[A-Z]*.ts',
    '!src/**/index.ts',
    '!src/core/requestPipeline/dependencies.ts',
  ],
  mutator: {
    excludedMutations: ['StringLiteral'],
  },
  // No global break: the gate is per directory, in mutation-bdd-thresholds.json.
  thresholds: { high: 80, low: 60, break: null },
  concurrency: 6,
  timeoutMS: 30000,
  tempDirName: '.stryker-tmp-bdd',
  cleanTempDir: true,
};
