/**
 * Examples import only what the npm package exports (#717).
 *
 * An example is written to be copied into an application, and the docs site
 * rewrites its `../src` imports to package sub-paths (IMPORT_MAP in
 * scripts/docs/examples-showcase-core.ts). A deeper path such as
 * `../src/core/util/error` has no equivalent in the package, so a copied
 * example would not compile. Each entry below is a `package.json` `exports`
 * sub-path as it is spelt inside the repository. Shared with the rule's own
 * test in tests/tdd/examples/.
 */
const ENTRY_POINTS = [
  '../src',
  '../src/schemas',
  '../src/errors',
  '../src/testing',
  '../src/client',
  '../src/sde',
  '../src/sde/memory',
];

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const allowed = ENTRY_POINTS.map((p) => escape(p.slice('../src'.length))).join(
  '|',
);

module.exports = {
  ENTRY_POINTS,
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            // Any ../src path that is not exactly one of the entry points.
            regex: `^\\.\\./src(?!(?:${allowed})$)(?:/.*)?$`,
            message:
              'Import from a published entry point (../src, ../src/errors, ../src/client, ../src/sde, ../src/sde/memory, ../src/schemas, ../src/testing), not an internal path: a copied example must compile against the npm package.',
          },
        ],
      },
    ],
  },
};
