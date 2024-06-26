const path = require('path');
const glob = require('glob');

console.log('Jest BDD Config Loaded');
console.log('Root Directory:', path.resolve(__dirname));
console.log('Looking for features in:', path.resolve(__dirname, 'tests/bdd/features'));

const featureFiles = glob.sync(path.resolve(__dirname, 'tests/bdd/features/**/*.feature'));
console.log('Discovered Feature Files:', featureFiles);

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/config/jest/jest.bdd.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/tests/tdd/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: ['**/tests/bdd/steps/**/*.ts'], // Adjust to match step definition files
  verbose: true,
};
