/**
 * Dual-build parity. For every sub-path in the installed package's `exports`
 * map, load it through both conditions — `require` (the CJS bundle) and
 * `import` (the ESM bundle) — and fail if either does not load or if the two
 * expose different export names. Reads the map from the installed tarball, so
 * a sub-path added later is covered without editing this file.
 *
 * Then, within each build, fail if two sub-paths export the same name as
 * different values. A class exported from both `.` and `./errors` must be one
 * class, or `instanceof` and the guards from one entry miss what the other
 * throws (esi-v2s.15). The root `schemas` namespace counts as the `./schemas`
 * entry. The CJS and ESM builds are separate module graphs, so identity is
 * only required within one of them.
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
/** Loaded modules per build, keyed by specifier. */
const loaded = { require: new Map(), import: new Map() };
for (const subpath of subpaths) {
  const specifier = subpath === '.' ? NAME : `${NAME}/${subpath.slice(2)}`;
  try {
    const cjs = require(specifier);
    const esm = await import(specifier);
    loaded.require.set(specifier, cjs);
    loaded.import.set(specifier, esm);
    const cjsNames = Object.keys(cjs)
      .filter((k) => k !== '__esModule')
      .sort();
    const esmNames = Object.keys(esm)
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

for (const [condition, modules] of Object.entries(loaded)) {
  /** Export name → the first specifier that exported it, and its value. */
  const seen = new Map();
  const failuresBefore = failures.length;
  let shared = 0;
  const check = (specifier, name, value) => {
    const first = seen.get(name);
    if (!first) {
      seen.set(name, { specifier, value });
      return;
    }
    shared += 1;
    if (first.value !== value) {
      failures.push(
        `${condition}: '${name}' from ${specifier} is not the same value as from ${first.specifier}`,
      );
    }
  };
  for (const [specifier, mod] of modules) {
    for (const [name, value] of Object.entries(mod)) {
      if (name === '__esModule' || name === 'default') continue;
      if (specifier === NAME && name === 'schemas') {
        for (const [schema, s] of Object.entries(value)) {
          check(`${NAME} (schemas)`, `schemas:${schema}`, s);
        }
        continue;
      }
      const key = specifier.startsWith(`${NAME}/schemas`)
        ? `schemas:${name}`
        : name;
      check(specifier, key, value);
    }
  }
  if (failures.length === failuresBefore) {
    console.log(
      `identity: ${condition} OK (${shared} exports shared between sub-paths)`,
    );
  }
}

if (failures.length > 0) {
  console.error(`Dual-build parity failed:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
