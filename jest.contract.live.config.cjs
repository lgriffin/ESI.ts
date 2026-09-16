// Live contract tier: `npm run contract:live`, which CI's contract-tests job
// runs.
//
// The contract config plus a globalSetup that throws unless
// ESI_LIVE_TESTS=true, so requesting this tier without the variable fails
// loudly instead of skipping every suite (R12). The default tier,
// `npm run contract`, is unchanged and still skips without the variable.
const base = require('./jest.contract.config.cjs');

module.exports = {
  ...base,
  globalSetup: '<rootDir>/tests/setup/requireLiveTests.ts',
};
