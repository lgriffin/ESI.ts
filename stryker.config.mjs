import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname);

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'jest',
  jest: {
    configFile: 'jest.unit.config.cjs',
    enableFindRelatedTests: false,
    config: {
      roots: [
        '<rootDir>/src',
        path.join(projectRoot, 'tests'),
      ],
      testMatch: [
        path.join(projectRoot, 'tests/tdd/**/*.test.ts'),
      ],
      moduleNameMapper: {
        '^(?:\\.\\./)+src/(.*)$': '<rootDir>/src/$1',
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
  ],
  thresholds: {
    high: 80,
    low: 60,
    break: 65,
  },
  timeoutMS: 60000,
  tempDirName: '.stryker-tmp',
  cleanTempDir: true,
};
