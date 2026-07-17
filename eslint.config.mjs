import tseslint from 'typescript-eslint';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'dist/',
      'node_modules/',
      'coverage/',
      'docs/',
      'scripts/',
      '**/*.cjs',
      '**/*.js',
      '**/*.mjs',
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
);
