/**
 * Self-tests for the release SBOM (scripts/release-sbom-core.ts, SEC-06).
 *
 * The SBOM is attached to a release and signed, so a wrong one is worse than
 * none: it tells a consumer's scanner the package contains something it does
 * not, or omits something it does. The validator is what stops the release
 * attaching one, so most of these tests are about the ways it could pass a bad
 * document.
 *
 * The last block runs the real generator over this repository's package.json
 * and lockfile. It is the regression test for the reason the generator exists
 * at all: `npm sbom --omit dev` drops zod and three of pino's dependencies,
 * because dev tools depend on them too.
 */
import { gzipSync } from 'zlib';
import { readFileSync } from 'fs';
import * as path from 'path';

import {
  Manifest,
  ReleaseSbomError,
  nameRootComponent,
  npmPurl,
  productionManifest,
  readTarEntry,
  sbomFileName,
  sbomProblems,
} from '../../../scripts/release-sbom-core';
import { generateSbom } from '../../../scripts/release-sbom';

const ROOT = path.resolve(__dirname, '../../..');

const MANIFEST: Manifest = {
  name: '@lgriffin/esi.ts',
  version: '10.2.0',
  dependencies: { pino: '^9.6.0', zod: '^4.0.0' },
  devDependencies: { typescript: '^6.0.3' },
  peerDependencies: { 'js-yaml': '>=3.13.1' },
  peerDependenciesMeta: { 'js-yaml': { optional: true } },
};

function component(name: string, version: string, scope = 'required') {
  return {
    'bom-ref': `${name}@${version}`,
    type: 'library',
    name,
    version,
    scope,
    purl: npmPurl(name, version),
  };
}

/** What npm sbom writes for MANIFEST, trimmed to the fields that matter. */
function validSbom(): Record<string, any> {
  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    serialNumber: 'urn:uuid:71dbf378-4759-4ce7-a4de-74f106713b75',
    version: 1,
    metadata: {
      component: {
        'bom-ref': '@lgriffin/esi.ts@10.2.0',
        type: 'library',
        name: '@lgriffin/esi.ts',
        version: '10.2.0',
        purl: 'pkg:npm/%40lgriffin/esi.ts@10.2.0',
      },
    },
    components: [
      component('pino', '9.14.0'),
      component('sonic-boom', '4.2.1'),
      component('zod', '4.6.4'),
    ],
    dependencies: [
      {
        ref: '@lgriffin/esi.ts@10.2.0',
        dependsOn: ['pino@9.14.0', 'zod@4.6.4'],
      },
      { ref: 'pino@9.14.0', dependsOn: ['sonic-boom@4.2.1'] },
    ],
  };
}

/** A gzipped ustar archive holding `files`, as `npm pack` would write it. */
function tgz(files: Record<string, string>, usePrefix = false): Buffer {
  const blocks: Buffer[] = [];
  for (const [name, content] of Object.entries(files)) {
    const header = Buffer.alloc(512);
    const slash = name.lastIndexOf('/');
    if (usePrefix && slash > 0) {
      header.write(name.slice(slash + 1), 0);
      header.write(name.slice(0, slash), 345);
    } else {
      header.write(name, 0);
    }
    const body = Buffer.from(content, 'utf8');
    header.write(`${body.length.toString(8).padStart(11, '0')}\0`, 124);
    header.write('0', 156);
    header.write('ustar\0', 257);
    blocks.push(header, body, Buffer.alloc((512 - (body.length % 512)) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(blocks));
}

describe('sbomFileName', () => {
  it('names the SBOM after the tarball, with the CycloneDX extension', () => {
    expect(sbomFileName('lgriffin-esi.ts-10.2.0.tgz')).toBe(
      'lgriffin-esi.ts-10.2.0.cdx.json',
    );
    expect(sbomFileName('release-artifacts/lgriffin-esi.ts-10.2.0.tgz')).toBe(
      'lgriffin-esi.ts-10.2.0.cdx.json',
    );
  });

  it('refuses something that is not a tarball', () => {
    expect(() => sbomFileName('checksums.txt')).toThrow(ReleaseSbomError);
  });
});

describe('npmPurl', () => {
  it('percent-encodes the scope', () => {
    expect(npmPurl('@lgriffin/esi.ts', '10.2.0')).toBe(
      'pkg:npm/%40lgriffin/esi.ts@10.2.0',
    );
    expect(npmPurl('zod', '4.6.4')).toBe('pkg:npm/zod@4.6.4');
  });
});

describe('readTarEntry', () => {
  const manifest = JSON.stringify({ name: '@lgriffin/esi.ts' });

  it('reads one file out of a gzipped tarball', () => {
    const archive = tgz({
      'package/README.md': '# readme\n'.repeat(100),
      'package/package.json': manifest,
    });
    expect(readTarEntry(archive, 'package/package.json').toString()).toBe(
      manifest,
    );
  });

  it('joins the ustar prefix to the name', () => {
    const archive = tgz({ 'package/package.json': manifest }, true);
    expect(readTarEntry(archive, 'package/package.json').toString()).toBe(
      manifest,
    );
  });

  it('fails when the file is not there', () => {
    const archive = tgz({ 'package/README.md': 'x' });
    expect(() => readTarEntry(archive, 'package/package.json')).toThrow(
      ReleaseSbomError,
    );
  });
});

describe('productionManifest', () => {
  it('keeps the runtime dependencies and drops dev dependencies and optional peers', () => {
    const production = productionManifest(MANIFEST);
    expect(production.dependencies).toEqual(MANIFEST.dependencies);
    expect(production.devDependencies).toBeUndefined();
    expect(production.peerDependencies).toBeUndefined();
    expect(production.peerDependenciesMeta).toBeUndefined();
    expect(production.name).toBe(MANIFEST.name);
    expect(production.version).toBe(MANIFEST.version);
  });

  it('leaves the manifest it was given alone', () => {
    productionManifest(MANIFEST);
    expect(MANIFEST.devDependencies).toEqual({ typescript: '^6.0.3' });
  });
});

describe('nameRootComponent', () => {
  it('replaces the directory name npm used with the package name', () => {
    const sbom = validSbom();
    sbom.metadata.component.name = 'ESI.ts';
    const named = nameRootComponent(sbom, MANIFEST) as Record<string, any>;
    expect(named.metadata.component.name).toBe('@lgriffin/esi.ts');
    expect(named.metadata.component.purl).toBe(sbom.metadata.component.purl);
    expect(sbom.metadata.component.name).toBe('ESI.ts');
  });

  it('passes through a document with no root component, for the validator to reject', () => {
    expect(nameRootComponent('nope', MANIFEST)).toBe('nope');
    expect(nameRootComponent({ metadata: {} }, MANIFEST)).toEqual({
      metadata: {},
    });
  });
});

describe('sbomProblems', () => {
  it('finds nothing wrong with a document that describes the package', () => {
    expect(sbomProblems(validSbom(), MANIFEST)).toEqual([]);
  });

  it('rejects something that is not a JSON object', () => {
    expect(sbomProblems([], MANIFEST)).toEqual(['not a JSON object']);
    expect(sbomProblems(null, MANIFEST)).toEqual(['not a JSON object']);
  });

  it.each<[string, (s: Record<string, any>) => void, RegExp]>([
    ['an SPDX document', (s) => (s.bomFormat = 'SPDX'), /bomFormat/],
    ['an old spec', (s) => (s.specVersion = '1.3'), /specVersion/],
    ['a spec that is not 1.x', (s) => (s.specVersion = '2'), /specVersion/],
    ['no serial number', (s) => delete s.serialNumber, /serialNumber/],
    [
      'the checkout folder as the name',
      (s) => (s.metadata.component.name = 'ESI.ts'),
      /metadata\.component\.name/,
    ],
    [
      'another version',
      (s) => (s.metadata.component.version = '10.1.1'),
      /metadata\.component\.version/,
    ],
    [
      'another purl',
      (s) => (s.metadata.component.purl = 'pkg:npm/esi.ts@10.2.0'),
      /metadata\.component\.purl/,
    ],
    ['no root component', (s) => delete s.metadata, /names no package/],
    ['no components', (s) => delete s.components, /components is missing/],
    [
      'a dependency left out',
      (s) => (s.components = s.components.filter((c: any) => c.name !== 'zod')),
      /zod is a dependency in package\.json but not a component/,
    ],
    [
      'a dependency marked optional',
      (s) => (s.components[2].scope = 'optional'),
      /zod .*scope "required"/,
    ],
    [
      'a dependency the package does not depend on',
      (s) => (s.dependencies[0].dependsOn = ['pino@9.14.0']),
      /zod .*does not depend on it/,
    ],
    [
      'no dependency graph for the package',
      (s) => (s.dependencies = []),
      /no entry for the package itself/,
    ],
    [
      'a dev dependency in the tree',
      (s) => {
        s.components.push(component('typescript', '6.0.3'));
        s.dependencies[0].dependsOn.push('typescript@6.0.3');
      },
      /typescript, which package\.json declares only for development/,
    ],
    [
      'an edge to a component that is not listed',
      (s) => s.dependencies[0].dependsOn.push('ghost@1.0.0'),
      /ghost@1\.0\.0, which is not a component/,
    ],
    [
      'a component with no purl',
      (s) => delete s.components[1].purl,
      /sonic-boom@4\.2\.1 has no purl/,
    ],
    [
      'a component listed twice',
      (s) => s.components.push(component('pino', '9.14.0')),
      /pino@9\.14\.0 is listed twice/,
    ],
  ])('rejects %s', (_label, mutate, expected) => {
    const sbom = validSbom();
    mutate(sbom);
    const problems = sbomProblems(sbom, MANIFEST);
    expect(problems.some((p) => expected.test(p))).toBe(true);
  });

  it('accepts an optional peer the package depends on', () => {
    const sbom = validSbom();
    sbom.components.push(component('js-yaml', '4.1.0', 'optional'));
    sbom.dependencies[0].dependsOn.push('js-yaml@4.1.0');
    expect(sbomProblems(sbom, MANIFEST)).toEqual([]);
  });
});

describe('generateSbom against this repository', () => {
  const manifest = JSON.parse(
    readFileSync(path.join(ROOT, 'package.json'), 'utf8'),
  ) as Manifest;
  let sbom: Record<string, any>;

  beforeAll(() => {
    sbom = generateSbom(
      manifest,
      path.join(ROOT, 'package-lock.json'),
    ) as Record<string, any>;
  }, 180_000);

  it('describes the package at its version with every runtime dependency', () => {
    expect(sbomProblems(sbom, manifest)).toEqual([]);
  });

  it('keeps what npm sbom --omit dev loses to the dev tree', () => {
    const names = sbom.components.map((c: { name: string }) => c.name);
    // zod is also a dependency of knip; the rest are pino's, shared with
    // dev tools. `--omit dev` drops every one of them.
    expect(names).toEqual(
      expect.arrayContaining([
        'zod',
        'atomic-sleep',
        'quick-format-unescaped',
        'split2',
      ]),
    );
  });

  it('lists nothing from the dev tree', () => {
    const names = new Set(sbom.components.map((c: { name: string }) => c.name));
    for (const dev of ['typescript', 'jest', 'knip', 'tsup', 'eslint']) {
      expect(names.has(dev)).toBe(false);
    }
  });
});
