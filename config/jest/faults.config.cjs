/**
 * Fault catalogue (tests/faults): transport-level faults through the real
 * request pipeline. `npm run faults` runs the catalogue and its self-test on
 * every PR; `npm run faults:nightly` (config/jest/faults.nightly.config.cjs) runs the
 * seeded payload fuzz across every endpoint definition.
 */
module.exports = {
  rootDir: '../..',
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  testMatch: ['<rootDir>/tests/faults/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '\.nightly\.test\.ts$'],
  verbose: true,
  testTimeout: 30000,
};
