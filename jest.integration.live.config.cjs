// Live integration tier: `npm run test:integration:live`.
//
// The mocked integration config restricted to the live ESI smoke suite, plus
// a globalSetup that throws unless ESI_LIVE_TESTS=true. Requesting this tier
// without the variable fails loudly instead of skipping every suite (R12).
// The default tier, `npm run test:integration`, is unchanged.
const base = require('./jest.integration.config.cjs');

module.exports = {
  ...base,
  testMatch: ['<rootDir>/tests/integration/live-esi.test.ts'],
  globalSetup: '<rootDir>/tests/setup/requireLiveTests.ts',
};
