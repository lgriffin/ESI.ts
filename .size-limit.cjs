/**
 * Size budgets for every `package.json` `exports` sub-path (`npm run size`).
 * How a check measures is described in scripts/size-limit-checks.cjs:
 * the entry plus every chunk it loads, minified, uncompressed, with runtime
 * and peer dependencies external.
 *
 * Budgets are the size measured on master at 81179572 (9.9.0) plus 5%,
 * rounded up to 0.1 kB (1 kB = 1000 B). The comment on each line is the
 * measured size, in bytes, that its budget was set from.
 *
 * Raising a budget: run `npm run build && npm run size`, set the new
 * measurement plus 5%, update the comment, and say in the pull request body
 * what grew and why it is worth the bytes. This file is owned through
 * CODEOWNERS like the other CI configuration.
 */
'use strict';

const manifest = require('./package.json');
const { sizeLimitChecks } = require('./scripts/size-limit-checks.cjs');

const budgets = {
  '.': {
    import: '222.6 kB', // measured 211924 B
    require: '242.9 kB', // measured 231262 B
  },
  './schemas': {
    import: '58.1 kB', // measured 55240 B
    require: '71.6 kB', // measured 68145 B
  },
  './errors': {
    import: '4.1 kB', // measured 3900 B
    require: '9.8 kB', // measured 9246 B
  },
  './testing': {
    import: '16.4 kB', // measured 15540 B
    require: '23 kB', // measured 21854 B
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
