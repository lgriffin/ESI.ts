const path = require('path');

console.log('Jest Fuzz Config Loaded');
console.log('Root Directory:', path.resolve(__dirname));
console.log('Looking for fuzz tests in:', path.resolve(__dirname, 'tests/fuzz'));

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  testMatch: [
    '<rootDir>/tests/fuzz/**/*.test.ts',
  ],
  verbose: true,
  testTimeout: 30000,
};
