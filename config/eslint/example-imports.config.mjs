// Lints examples/ for one rule only: npm run lint:example-imports. Examples
// import only the package's published entry points (#717); the full rule set
// does not apply to them.
import tseslint from 'typescript-eslint';
import exampleImports from './example-imports.rules.cjs';

export default [
  {
    files: ['examples/**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: exampleImports.rules,
  },
];
