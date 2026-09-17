module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // tests/contract/replay/ is the offline replay tier (jest.contract.replay.config.cjs).
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/tests/contract/replay/',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  testMatch: ['<rootDir>/tests/contract/**/*.test.ts'],
  verbose: true,
  testTimeout: 60000,
};
