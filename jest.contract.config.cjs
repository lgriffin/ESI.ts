const path = require('path');

console.log('Jest Contract Config Loaded');
console.log('Root Directory:', path.resolve(__dirname));
console.log(
  'Looking for contract tests in:',
  path.resolve(__dirname, 'tests/contract'),
);

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  testMatch: ['<rootDir>/tests/contract/**/*.test.ts'],
  verbose: true,
  testTimeout: 60000,
};
