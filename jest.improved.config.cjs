const path = require('path');

console.log('Jest Improved Test Config Loaded');
console.log('Root Directory:', path.resolve(__dirname));

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/config/jest/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: ['<rootDir>/tests/tdd/**/*.improved.test.ts'],
  verbose: true,
  coverageDirectory: 'coverage/improved',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/demo/**',
    '!src/testing/**'
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  // Enhanced test configuration
  testTimeout: 10000, // 10 seconds for resilience tests
  maxWorkers: '50%', // Use half available cores for stability
  bail: false, // Don't stop on first failure
  errorOnDeprecated: true,
  detectOpenHandles: true,
  forceExit: true,
  // Custom reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage/improved',
      outputName: 'junit.xml',
    }]
  ]
};
