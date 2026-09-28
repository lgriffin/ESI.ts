/**
 * npm run spec:coverage:sde [-- --ci] [-- --write-baseline] [-- --root <dir>]
 *
 * Prints, for every IStaticDataProvider method, how many Rules and scenarios
 * of tests/bdd/features/sde reach it, and the uncovered methods grouped by
 * entity family. See sde-spec-coverage-core.ts for what counts as coverage.
 *
 * Exit 2 means the check itself is broken. When
 * scripts/sde/sde-spec-coverage-baseline.json exists, the report also fails
 * (exit 1) on an uncovered method it does not list under its family and on an
 * entry that is now covered, no longer a method or under the wrong family,
 * which needs no git history, so `check:local` runs it. --ci also fails on a
 * method absent from the base branch's copy: SDE_SPEC_COVERAGE_BASE_REF, then
 * origin/master, then master; with none available every entry counts as
 * added.
 *
 * --write-baseline rewrites the baseline from today's result; --ci still
 * rejects any method it adds.
 */
import * as path from 'path';

import { mainOf } from '../spec/method-coverage-core';
import {
  RATCHET_WORDS,
  analyseCoverage,
  applyBaseline,
  integrityProblems,
  parseBaseline,
  renderReport,
  serializeBaseline,
} from './sde-spec-coverage-core';

mainOf(
  {
    title: 'SDE specification coverage',
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
