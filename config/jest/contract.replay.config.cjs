// Recorded payload replay tier: `npm run contract:replay`, which CI's
// contract-replay job runs with no network.
//
// Replays every fixture in tests/contract/fixtures/recorded/ through the full
// client pipeline at the BDD transport seam, so it needs the unit tier's
// jest-fetch-mock setup rather than the live contract config.
module.exports = {
  rootDir: '../..',
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  testMatch: ['<rootDir>/tests/contract/replay/**/*.test.ts'],
  verbose: false,
  testTimeout: 30000,
};
