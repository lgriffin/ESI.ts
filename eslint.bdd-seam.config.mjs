// Lints tests/bdd for R3 only: npm run lint:bdd-seam. The full rule set does
// not apply to tests yet; this config carries the one rule that must.
import tsParser from '@typescript-eslint/parser';
import seamRules from './eslint.bdd-seam.rules.cjs';

export default [
  {
    files: ['tests/bdd/**/*.ts'],
    languageOptions: { parser: tsParser },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: seamRules,
  },
];
