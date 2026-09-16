/**
 * `./sde` and its optional peer dependencies, js-yaml and adm-zip (esi-v2s.16).
 * Every check runs twice: through `require` (the CJS bundle) and through
 * `import` (the ESM bundle).
 *
 *   node runtime/sde-optional-peers.mjs absent
 *     Neither peer is installed. `./sde` must load, and reading YAML or a ZIP
 *     must throw an SdeError that names the missing package and how to
 *     install it.
 *
 *   node runtime/sde-optional-peers.mjs present
 *     Both peers are installed. fromDirectory and fromZip must load real SDE
 *     files, which proves each bundle resolves the peers from the package.
 */
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const SPECIFIER = '@lgriffin/esi.ts/sde';
const PEERS = ['js-yaml', 'adm-zip'];

const mode = process.argv[2];
assert.ok(
  mode === 'absent' || mode === 'present',
  'usage: sde-optional-peers.mjs absent|present',
);

function peerIsResolvable(name) {
  try {
    require.resolve(name);
    return true;
  } catch {
    return false;
  }
}

for (const peer of PEERS) {
  assert.equal(
    peerIsResolvable(peer),
    mode === 'present',
    `${peer} should be ${mode} in the consumer`,
  );
}

// Nested under `sde:`, so the version checks in expectLoaded pass only when
// both fromDirectory and fromZip read that layout (esi-v2s.20).
const META_YAML = "sde:\n  buildNumber: 3141592\n  releaseDate: '2026-09-01'\n";
const CATEGORIES_YAML = '6:\n  name:\n    en: Ship\n  published: true\n';

const work = mkdtempSync(path.join(tmpdir(), 'esi-sde-peers-'));
const dir = path.join(work, 'sde-data');
const zip = path.join(work, 'sde.zip');
try {
  mkdirSync(dir);
  writeFileSync(path.join(dir, '_sde.yaml'), META_YAML);
  writeFileSync(path.join(dir, 'categories.yaml'), CATEGORIES_YAML);
  if (mode === 'present') {
    const AdmZip = require('adm-zip');
    const archive = new AdmZip();
    archive.addFile('_sde.yaml', Buffer.from(META_YAML));
    archive.addFile('categories.yaml', Buffer.from(CATEGORIES_YAML));
    archive.writeZip(zip);
  } else {
    // Never opened: the missing adm-zip is reported first.
    writeFileSync(zip, 'not a zip');
  }

  const builds = [
    ['require', require(SPECIFIER)],
    ['import', await import(SPECIFIER)],
  ];

  for (const [condition, sde] of builds) {
    if (mode === 'absent') {
      expectMissingPeer(condition, sde, 'js-yaml', () =>
        sde.SdeDataProvider.fromDirectory(dir),
      );
      expectMissingPeer(condition, sde, 'adm-zip', () =>
        sde.SdeDataProvider.fromZip(zip),
      );
    } else {
      expectLoaded(condition, 'fromDirectory', () =>
        sde.SdeDataProvider.fromDirectory(dir),
      );
      expectLoaded(condition, 'fromZip', () =>
        sde.SdeDataProvider.fromZip(zip),
      );
    }
    console.log(`${condition}: ${SPECIFIER} with peers ${mode} OK`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

function expectMissingPeer(condition, sde, peer, load) {
  assert.throws(
    load,
    (err) => {
      assert.ok(
        sde.isSdeError(err),
        `${condition}: expected an SdeError for missing ${peer}, got ${err}`,
      );
      assert.ok(
        err.message.includes(`npm install ${peer}`),
        `${condition}: the error should say how to install ${peer}: ${err.message}`,
      );
      return true;
    },
    `${condition}: expected loading to fail without ${peer}`,
  );
}

function expectLoaded(condition, factory, load) {
  const provider = load();
  assert.equal(
    provider.getVersion().version,
    '3141592',
    `${condition}: ${factory} version`,
  );
  assert.equal(
    provider.getVersion().buildDate,
    '2026-09-01',
    `${condition}: ${factory} build date`,
  );
  assert.equal(
    provider.getCategory(6)?.name,
    'Ship',
    `${condition}: ${factory} category`,
  );
  provider.close();
}
