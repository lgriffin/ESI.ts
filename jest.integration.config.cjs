const path = require('path');

console.log('Jest Integration Config Loaded');
console.log('Root Directory:', path.resolve(__dirname));
console.log('Looking for integration tests in:', path.resolve(__dirname, 'tests/integration'));

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  testMatch: [
    '<rootDir>/tests/integration/**/*.test.ts',
  ],
  verbose: true,
  testTimeout: 30000,
};
