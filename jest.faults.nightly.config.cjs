/**
 * Nightly run of the fault tier: the seeded payload fuzz across every
 * endpoint definition (tests/faults/*.nightly.test.ts). FAULTS_SEED replays a
 * run; FAULTS_RUNS sets cases per endpoint. See tests/faults/AGENTS.md.
 */
const base = require('./jest.faults.config.cjs');

module.exports = {
  ...base,
  testMatch: ['<rootDir>/tests/faults/**/*.nightly.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  verbose: false,
  testTimeout: 600000,
};
