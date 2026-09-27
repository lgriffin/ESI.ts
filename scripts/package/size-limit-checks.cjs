/**
 * Builds the size-limit checks for every `package.json` `exports` sub-path,
 * once for the ES module build (`import`) and once for the CommonJS build
 * (`require`). Loaded by `.size-limit.cjs`; CommonJS so that size-limit can
 * load it without a TypeScript loader.
 *
 * What a check measures: the sub-path's entry file bundled by esbuild with
 * everything it imports from the package (tsup's shared `chunk-*` files
 * included), as a consumer loading that sub-path would, minified and
 * uncompressed. Node reads the files from disk, so compressed transfer size
 * is not the cost a consumer pays. Runtime and peer dependencies (`pino`,
 * `zod`, `better-sqlite3`, `js-yaml`, `adm-zip`) and Node built-ins are
 * external: the budget is this package's own code. A dependency that tsup
 * inlines, or a new import the dependency lists do not name, is measured.
 *
 * The exports map drives the list, so a new sub-path without a budget, or a
 * budget for a sub-path that no longer exists, fails `npm run size` before
 * anything is measured.
 */
'use strict';

/** Conditions measured for each sub-path, with the build they select. */
const CONDITIONS = [
  { condition: 'import', label: 'ESM' },
  { condition: 'require', label: 'CJS' },
];

/** Sub-paths that are not code. */
const NOT_CODE = new Set(['./package.json']);

function externalsOf(manifest) {
  return [
    ...Object.keys(manifest.dependencies || {}),
    ...Object.keys(manifest.peerDependencies || {}),
  ];
}

function targetFor(entry, condition) {
  if (!entry || typeof entry !== 'object') return undefined;
  const target = entry[condition];
  if (typeof target === 'string') return target;
  if (
    target &&
    typeof target === 'object' &&
    typeof target.default === 'string'
  ) {
    return target.default;
  }
  return undefined;
}

/**
 * @param {{ exports?: Record<string, unknown>, dependencies?: Record<string, string>, peerDependencies?: Record<string, string> }} manifest
 * @param {Record<string, Record<string, string>>} budgets sub-path → condition → size-limit `limit`
 * @returns {Array<Record<string, unknown>>} size-limit checks
 */
function sizeLimitChecks(manifest, budgets) {
  const exportsMap = manifest.exports || {};
  const subpaths = Object.keys(exportsMap).filter((key) => !NOT_CODE.has(key));
  const problems = [];

  if (subpaths.length === 0) {
    problems.push('package.json has no code sub-paths in "exports"');
  }
  for (const subpath of Object.keys(budgets)) {
    if (!subpaths.includes(subpath)) {
      problems.push(
        `budget for "${subpath}", which is not in package.json "exports": remove it`,
      );
    }
  }

  const checks = [];
  for (const subpath of subpaths) {
    for (const { condition, label } of CONDITIONS) {
      const target = targetFor(exportsMap[subpath], condition);
      const limit = budgets[subpath] && budgets[subpath][condition];
      if (!target) {
        problems.push(
          `exports["${subpath}"] has no "${condition}" target to measure`,
        );
        continue;
      }
      if (!limit) {
        problems.push(
          `no ${label} budget for "${subpath}" (${target}): add budgets["${subpath}"].${condition}`,
        );
        continue;
      }
      checks.push({
        name: `${subpath} (${label})`,
        path: target.replace(/^\.\//, ''),
        import: '*',
        limit,
        brotli: false,
        ignore: externalsOf(manifest),
        modifyEsbuildConfig(config) {
          // Built-ins such as fs and path stay external, as they are in Node.
          config.platform = 'node';
          // ES module output keeps import.meta (the tsup shims) meaningful.
          config.format = 'esm';
          return config;
        },
      });
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `size-limit budgets do not match package.json exports:\n  ${problems.join('\n  ')}`,
    );
  }
  return checks;
}

module.exports = { sizeLimitChecks };
