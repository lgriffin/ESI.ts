/**
 * npm run spec:coverage:clients [-- --ci] [-- --write-baseline] [-- --root <dir>]
 *
 * Prints, for every domain client in src/clients, how many of its public
 * methods a Rule names or a bound step calls, and the uncovered methods
 * grouped by client. See client-spec-coverage-core.ts for what counts as
 * coverage.
 *
 * Exit 2 means the check itself is broken. When
 * scripts/spec/client-spec-coverage-baseline.json exists, the report also
 * fails (exit 1) on an uncovered method it does not list under its client and
 * on an entry that is now covered or no longer a method, which needs no git
 * history, so `check:local` runs it. --ci also fails on an entry absent from
 * the base branch's copy: CLIENT_SPEC_COVERAGE_BASE_REF, then origin/master,
 * then master; with none available every entry counts as added.
 *
 * --write-baseline rewrites the baseline from today's result; --ci still
 * rejects any entry it adds.
 */
import * as path from 'path';

import {
  RATCHET_WORDS,
  analyseCoverage,
  applyBaseline,
  integrityProblems,
  parseBaseline,
  renderReport,
  serializeBaseline,
} from './client-spec-coverage-core';
import { mainOf } from './method-coverage-core';

mainOf(
  {
    title: 'Client specification coverage',
    words: RATCHET_WORDS,
    analyse: analyseCoverage,
    render: renderReport,
    integrity: integrityProblems,
    serialize: serializeBaseline,
    parse: parseBaseline,
    apply: applyBaseline,
  },
  path.resolve(__dirname, '../..'),
);
