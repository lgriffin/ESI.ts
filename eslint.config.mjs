import tseslint from 'typescript-eslint';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import prettierConfig from 'eslint-config-prettier';
import loggerImports from './config/eslint/logger-imports.rules.cjs';

export default tseslint.config(
  {
    ignores: [
      'dist/',
      'node_modules/',
      'coverage/',
      'docs-site/',
      'scripts/',
      '**/*.cjs',
      '**/*.js',
      '**/*.mjs',
      // Fixture trees under tests/ are inputs to other checks' tests (lint
      // rules, spec audit, determinism lint, type mutation): several break the
      // rules on purpose. Same globs as config/eslint/suite-health.rules.cjs.
      'tests/**/fixtures/**',
      'tests/**/*-fixtures/**',
      // A packed-tarball consumer: its '@lgriffin/esi.ts' imports resolve
      // only inside the scratch install npm run test:consumer builds, which
      // type-checks it there under node16, nodenext and bundler resolution.
      'tests/consumer/**',
    ],
  },

  tseslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,

  security.configs.recommended,
  sonarjs.configs.recommended,

  prettierConfig,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',

      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-constant-condition': 'warn',

      'sonarjs/unused-import': 'off',
      'sonarjs/no-unused-vars': 'off',
      'sonarjs/different-types-comparison': 'warn',
      'sonarjs/no-clear-text-protocols': 'warn',
      'sonarjs/no-dead-store': 'warn',
      'sonarjs/no-nested-template-literals': 'warn',
      'sonarjs/prefer-regexp-exec': 'warn',
      'sonarjs/no-nested-conditional': 'warn',
      'sonarjs/cognitive-complexity': ['warn', 20],
      'sonarjs/sonar-no-unused-vars': 'off',
      'sonarjs/todo-tag': 'off',
      'sonarjs/fixme-tag': 'off',
    },
  },

  // Test source (charter TEST-09, #271): the same rule set as src/, with the
  // relaxations below declared explicitly. no-floating-promises,
  // no-misused-promises and await-thenable stay errors: a floating promise in
  // a step file is a scenario that passes without asserting.
  {
    files: ['tests/**/*.ts'],
    languageOptions: {
      parserOptions: {
        // tests/ is compiled under tsconfig.test.json (every Jest config's
        // ts-jest transform); the root tsconfig.json covers src/ only, so the
        // project service would find no project for a test file.
        projectService: false,
        project: './tsconfig.test.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Kept as errors, restated so a relaxation below cannot drop them.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',

      // Relaxations, each for a pattern test code needs and src/ does not.
      // Tests build deliberately ill-typed inputs (`as any`) and read mock
      // and fixture internals through them.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      // tsconfig.test.json turns noUncheckedIndexedAccess off, so the `[i]!`
      // assertions written for the strict config read as unnecessary.
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      // expect(mock.method).toHaveBeenCalled() passes a Jest mock, not a
      // method that needs its `this`.
      '@typescript-eslint/unbound-method': 'off',
      // Test doubles and step callbacks are async to match the signature they
      // stand in for; a missing await is no-floating-promises' job.
      '@typescript-eslint/require-await': 'off',
      // Tests throw and reject with non-Errors to exercise the client's
      // handling of them, and rethrow caught unknowns unchanged.
      '@typescript-eslint/only-throw-error': 'off',
      '@typescript-eslint/prefer-promise-reject-errors': 'off',
      // Fetch doubles stringify RequestInfo | URL (the client passes a
      // string) and failure messages stringify unknown values.
      '@typescript-eslint/no-base-to-string': 'off',
      // Tests load modules by computed path and re-require them inside
      // jest.isolateModules or after jest.doMock, which import cannot do.
      '@typescript-eslint/no-require-imports': 'off',
      // No untrusted input reaches test code: it indexes its own tables,
      // builds its own fixture paths and regexes, and runs them on repo data.
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-non-literal-regexp': 'off',
      'security/detect-non-literal-require': 'off',
      'security/detect-unsafe-regex': 'off',
      'security/detect-possible-timing-attacks': 'off',
      'sonarjs/super-linear-regex': 'off',
      'sonarjs/slow-regex': 'off',
      // Random test data and jitter samples, not secrets.
      'sonarjs/pseudo-random': 'off',
      // Scratch directories under os.tmpdir(), removed after the test.
      'sonarjs/publicly-writable-directories': 'off',
      // Tests spawn node, npx and git from PATH, as CI does.
      'sonarjs/no-os-command-from-path': 'off',
      // http:// URLs in tests are inputs the client must reject or fixtures
      // that never leave the process.
      'sonarjs/no-clear-text-protocols': 'off',
      // Spec files register scenarios through bindFeature() and properties
      // through helpers, and tests assert through helpers (assertThat,
      // assertNoProblems, fc.assert): neither rule sees them.
      // npm run lint:suite-health's jest/expect-expect, which knows the
      // helper names, is the assertion check for tests/.
      'sonarjs/no-empty-test-file': 'off',
      'sonarjs/assertions-in-tests': 'off',
      // Values compared exactly are fixture values passed through unchanged;
      // computed ones use toBeCloseTo.
      'sonarjs/no-floating-point-equality': 'off',
      // `void expr` marks an expression evaluated only for its type (tsd,
      // @ts-expect-error) or a value deliberately discarded.
      'sonarjs/void-use': 'off',
      // Tests pass undefined explicitly to pin the optional-argument path.
      'sonarjs/no-undefined-argument': 'off',
      // Tests keep deprecated APIs covered until they are removed; a warning
      // keeps new uses visible.
      'sonarjs/deprecation': 'warn',
      // A style preference for test layout: a warning, fixed as files change.
      'sonarjs/parameterized-tests': 'warn',
      // Default sorts in tests order strings (keys, paths, names) for an
      // order-insensitive comparison, where code-point order is what's
      // wanted; numeric sorts pass a comparator.
      'sonarjs/no-alphabetical-sort': 'off',
    },
  },

  // Live advisory reports: they print drift between the SDK and the live
  // spec without failing (see each file's header), so their tests end in a
  // placeholder assertion on purpose.
  {
    files: [
      'tests/contract/esi-contract.test.ts',
      'tests/contract/esi-snapshot.test.ts',
      'tests/integration/esi-spec-contract.test.ts',
    ],
    rules: { 'sonarjs/no-trivial-assertions': 'off' },
  },

  // A compile-time check: the test's real assertion is the type of the value
  // it compares, which ts-jest compiles.
  {
    files: ['tests/tdd/core/customClientGetters.test.ts'],
    rules: { 'sonarjs/no-trivial-assertions': 'off' },
  },

  // The interleaving scheduler's try catches only a synchronous throw from an
  // actor, turning it into a rejection its .then handles; deferring the call
  // into a promise chain would shift the interleaving by a tick.
  {
    files: ['tests/tdd/composition/support/interleave.ts'],
    rules: { 'sonarjs/no-try-promise': 'off' },
  },

  // tsd type tests: expectError() wraps the ill-typed expression itself,
  // assignments included.
  {
    files: ['tests/typetests/**/*.test-d.ts'],
    rules: { 'sonarjs/no-nested-assignment': 'off' },
  },

  // src/core/requestPipeline and src/clients log through the per-client
  // logger, never the global loggerUtil (#265).
  ...loggerImports.loggerImportsConfig(),
);
