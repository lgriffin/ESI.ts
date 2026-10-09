/**
 * Size budgets for every `package.json` `exports` sub-path (`npm run size`).
 * How a check measures is described in scripts/package/size-limit-checks.cjs:
 * the entry plus every chunk it loads, minified, uncompressed, with runtime
 * and peer dependencies external.
 *
 * Budgets are the size measured on master at 81179572 (9.9.0) plus 5%,
 * rounded up to 0.1 kB (1 kB = 1000 B). The comment on each line is the
 * measured size, in bytes, that its budget was set from. `./schemas` was
 * re-measured when the 2026-08-18 compatibility date added the military
 * campaign and meta name schemas, and `.` once #419, #422 and #424 had
 * grown it past its budget. `./client` was measured when ROADMAP Phase 2
 * PR 11 added it: the generated operations and the pipeline make it the
 * largest sub-path after the root. `./testing` was re-measured when PR 12
 * added `createMockTransport`. `.` (CJS) and `./errors` (ESM) were
 * re-measured when #256 added JWKS verification (`SsoJwks`,
 * `verifyAccessToken`, `TokenVerificationError`).
 *
 * Raising a budget: run `npm run build && npm run size`, set the new
 * measurement plus 5%, update the comment, and say in the pull request body
 * what grew and why it is worth the bytes. This file is owned through
 * CODEOWNERS like the other CI configuration.
 */
'use strict';

const manifest = require('./package.json');
const { sizeLimitChecks } = require('./scripts/package/size-limit-checks.cjs');

const budgets = {
  '.': {
    import: '234 kB', // measured 222825 B
    require: '268.8 kB', // measured 255913 B
  },
  './schemas': {
    import: '61 kB', // measured 58083 B
    require: '75.4 kB', // measured 71736 B
  },
  './errors': {
    // Raised for the typed error family (EsiNetworkError, CircuitOpenError,
    // the EsiFaultError classes and their guards), then for
    // TokenVerificationError.
    import: '5.5 kB', // measured 5224 B
    require: '9.8 kB', // measured 9246 B
  },
  './testing': {
    import: '19.5 kB', // measured 18540 B
    require: '26.5 kB', // measured 25150 B
  },
  './client': {
    import: '166.4 kB', // measured 158410 B
    require: '175.1 kB', // measured 166730 B
  },
  './sde': {
    import: '45.4 kB', // measured 43203 B
    require: '47.9 kB', // measured 45543 B
  },
  './sde/memory': {
    import: '20.7 kB', // measured 19649 B
    require: '22.5 kB', // measured 21391 B
  },
};

module.exports = sizeLimitChecks(manifest, budgets);
