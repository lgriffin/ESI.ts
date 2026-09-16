/**
 * Dual-build parity. For every sub-path in the installed package's `exports`
 * map, load it through both conditions — `require` (the CJS bundle) and
 * `import` (the ESM bundle) — and fail if either does not load or if the two
 * expose different export names. Reads the map from the installed tarball, so
 * a sub-path added later is covered without editing this file.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const NAME = '@lgriffin/esi.ts';
const pkg = require(`${NAME}/package.json`);

const subpaths = Object.keys(pkg.exports).filter(
  (key) => key !== './package.json',
);
assert.ok(subpaths.length > 0, 'the package declares no exports');

const failures = [];
for (const subpath of subpaths) {
  const specifier = subpath === '.' ? NAME : `${NAME}/${subpath.slice(2)}`;
  try {
    const cjsNames = Object.keys(require(specifier))
      .filter((k) => k !== '__esModule')
      .sort();
    const esmNames = Object.keys(await import(specifier))
      .filter((k) => k !== 'default')
      .sort();

    assert.ok(cjsNames.length > 0, `${specifier} (require) exports nothing`);
    assert.ok(esmNames.length > 0, `${specifier} (import) exports nothing`);

    const onlyCjs = cjsNames.filter((n) => !esmNames.includes(n));
    const onlyEsm = esmNames.filter((n) => !cjsNames.includes(n));
    assert.deepEqual(
      { onlyCjs, onlyEsm },
      { onlyCjs: [], onlyEsm: [] },
      `${specifier}: the CJS and ESM builds export different names`,
    );
    console.log(`parity: ${specifier} OK (${cjsNames.length} exports)`);
  } catch (err) {
    failures.push(
      `${specifier}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

if (failures.length > 0) {
  console.error(`Dual-build parity failed:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
