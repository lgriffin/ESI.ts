const path = require('path');

console.log('Jest Unit Config Loaded');
console.log('Root Directory:', path.resolve(__dirname));
console.log('Looking for unit tests in:', path.resolve(__dirname, 'tests/tdd'));

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/config/jest/jest.setup.ts'],
  globalSetup: '<rootDir>/src/config/jest/globalSetup.ts',
  globalTeardown: '<rootDir>/src/config/jest/globalTeardown.ts',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: [
    '<rootDir>/tests/tdd/**/*.test.ts',
    '<rootDir>/tests/bdd-scenarios/**/*.test.ts'
  ],
  verbose: true,
  coverageDirectory: 'coverage/unit',
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
