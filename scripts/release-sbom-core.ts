/**
 * SEC-06: each release publishes a CycloneDX SBOM as a signed release asset.
 *
 * Provenance says who built the package; the SBOM says what is inside it. For
 * this package "inside" means the runtime dependency tree a consumer's
 * `npm install @lgriffin/esi.ts` resolves: `dependencies` and their
 * transitive closure. The optional peers (`better-sqlite3`, `js-yaml`,
 * `adm-zip`) are left out; see productionManifest. The build bundles no
 * third-party package — tsup marks every dependency and peer `external`, and
 * the only node_modules code in dist/ is tsup's own few-line ESM shim for
 * `__filename` — so the tree is the whole story.
 *
 * `npm sbom` writes the document; nothing here needs a new dependency. It is
 * not run with `--omit dev` against the repository, because that is wrong in a
 * way that looks right: npm drops every node with an incoming edge from a dev
 * dependency, so `zod` (also required by knip) and three of pino's own
 * dependencies (`atomic-sleep`, `quick-format-unescaped`, `split2`) vanish from
 * the bill. scripts/release-sbom.ts instead builds a tree that has no dev
 * dependencies to begin with — the packed manifest without `devDependencies`,
 * pinned by the repository's lockfile — and asks npm to describe that.
 *
 * Everything below checks the result, so a release cannot attach an SBOM that
 * names the wrong package, the wrong version, or leaves out a dependency.
 *
 * Pure functions with no I/O, so the unit suite can import them.
 */
import { gunzipSync } from 'zlib';

export class ReleaseSbomError extends Error {}

/** The parts of package.json the SBOM is checked against. */
export interface Manifest {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
  optionalDependencies?: Record<string, string>;
  [key: string]: unknown;
}

/** The oldest CycloneDX spec accepted. npm 10 and 11 both write 1.5. */
export const MIN_SPEC_MINOR = 4;

/**
 * The asset name for a tarball's SBOM: `lgriffin-esi.ts-10.1.1.tgz` becomes
 * `lgriffin-esi.ts-10.1.1.cdx.json`, the extension CycloneDX recommends.
 */
export function sbomFileName(tarball: string): string {
  const base = tarball.replace(/^.*[\\/]/, '');
  if (!base.endsWith('.tgz')) {
    throw new ReleaseSbomError(`Expected a .tgz tarball, got "${tarball}".`);
  }
  return `${base.slice(0, -'.tgz'.length)}.cdx.json`;
}

/** The package URL of an npm package; the scope's `@` is percent-encoded. */
export function npmPurl(name: string, version: string): string {
  return `pkg:npm/${name.replace(/^@/, '%40')}@${version}`;
}

/**
 * One file's bytes from a gzipped tarball such as `npm pack` writes.
 *
 * Reads ustar headers directly rather than shelling out to `tar`, which on
 * Windows is bsdtar or GNU tar depending on PATH and reads `C:` in a path
 * differently between the two.
 */
export function readTarEntry(tgz: Buffer, entryName: string): Buffer {
  const tar = gunzipSync(tgz);
  let offset = 0;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const field = (start: number, length: number): string =>
      header
        .subarray(start, start + length)
        .toString('utf8')
        .replace(/\0.*$/s, '');
    const prefix = field(345, 155);
    const name = prefix ? `${prefix}/${field(0, 100)}` : field(0, 100);
    const size = parseInt(field(124, 12).trim() || '0', 8);
    const type = field(156, 1);
    const body = offset + 512;
    if (name === entryName && (type === '0' || type === '')) {
      return Buffer.from(tar.subarray(body, body + size));
    }
    offset = body + Math.ceil(size / 512) * 512;
  }
  throw new ReleaseSbomError(`${entryName} is not in the tarball.`);
}

/**
 * The manifest a consumer's install sees: the packed package.json without
 * `devDependencies`, which npm never installs for a dependency.
 *
 * The optional peers go too. A default install does not fetch them, their
 * ranges are open (`>=`), and the only versions the lockfile holds for them
 * are the ones this repository's tests use — so listing those would state a
 * version the consumer chose, not the package. It also keeps the output
 * stable across npm versions: npm 10 keeps optional peers found in the
 * lockfile, npm 11 prunes them.
 */
export function productionManifest(manifest: Manifest): Manifest {
  const production = { ...manifest };
  delete production.devDependencies;
  delete production.peerDependencies;
  delete production.peerDependenciesMeta;
  return production;
}

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * npm names the root component after the directory it ran in, not the
 * package: `bom-ref` and `purl` say `@lgriffin/esi.ts`, `name` says whatever
 * the checkout or temp folder was called. Set it to the package name so tools
 * that key on `name` find the right thing. Nothing else is touched.
 */
export function nameRootComponent(sbom: unknown, manifest: Manifest): unknown {
  if (!isObject(sbom) || !isObject(sbom.metadata)) return sbom;
  const component = sbom.metadata.component;
  if (!isObject(component)) return sbom;
  return {
    ...sbom,
    metadata: {
      ...sbom.metadata,
      component: { ...component, name: manifest.name },
    },
  };
}

/**
 * Everything wrong with an SBOM for `manifest`, one line each. Empty means it
 * is CycloneDX JSON, describes this package at this version, and lists every
 * runtime dependency as a required component the package depends on.
 */
export function sbomProblems(sbom: unknown, manifest: Manifest): string[] {
  if (!isObject(sbom)) return ['not a JSON object'];

  const problems: string[] = [];

  if (sbom.bomFormat !== 'CycloneDX') {
    problems.push(
      `bomFormat is ${JSON.stringify(sbom.bomFormat)}, not "CycloneDX"`,
    );
  }
  const spec = /^1\.(\d+)$/.exec(String(sbom.specVersion));
  if (!spec || Number(spec[1]) < MIN_SPEC_MINOR) {
    problems.push(
      `specVersion is ${JSON.stringify(sbom.specVersion)}; expected CycloneDX 1.${MIN_SPEC_MINOR} or later`,
    );
  }
  if (
    typeof sbom.serialNumber !== 'string' ||
    !/^urn:uuid:[0-9a-f-]{36}$/i.test(sbom.serialNumber)
  ) {
    problems.push('serialNumber is not a urn:uuid');
  }

  const root = isObject(sbom.metadata) ? sbom.metadata.component : undefined;
  const expectedPurl = npmPurl(manifest.name, manifest.version);
  if (!isObject(root)) {
    problems.push(
      'metadata.component is missing, so the SBOM names no package',
    );
  } else {
    if (root.name !== manifest.name) {
      problems.push(
        `metadata.component.name is ${JSON.stringify(root.name)}, not "${manifest.name}"`,
      );
    }
    if (root.version !== manifest.version) {
      problems.push(
        `metadata.component.version is ${JSON.stringify(root.version)}, not "${manifest.version}"`,
      );
    }
    if (root.purl !== expectedPurl) {
      problems.push(
        `metadata.component.purl is ${JSON.stringify(root.purl)}, not "${expectedPurl}"`,
      );
    }
  }

  if (!Array.isArray(sbom.components)) {
    problems.push('components is missing');
    return problems;
  }
  const components = sbom.components.filter(isObject);
  const refs = new Set<string>();
  for (const component of components) {
    const label = String(component['bom-ref'] ?? component.name);
    for (const key of ['name', 'version', 'purl', 'bom-ref']) {
      if (typeof component[key] !== 'string' || component[key] === '') {
        problems.push(`component ${label} has no ${key}`);
      }
    }
    if (typeof component['bom-ref'] === 'string') {
      if (refs.has(component['bom-ref'])) {
        problems.push(`component ${component['bom-ref']} is listed twice`);
      }
      refs.add(component['bom-ref']);
    }
  }

  const graph = Array.isArray(sbom.dependencies)
    ? sbom.dependencies.filter(isObject)
    : [];
  const rootRef = isObject(root) ? root['bom-ref'] : undefined;
  const rootEdges = graph.find((entry) => entry.ref === rootRef);
  const dependsOn = new Set(
    Array.isArray(rootEdges?.dependsOn) ? rootEdges.dependsOn.map(String) : [],
  );
  if (rootEdges === undefined) {
    problems.push('dependencies has no entry for the package itself');
  }

  for (const name of Object.keys(manifest.dependencies ?? {})) {
    const found = components.filter((c) => c.name === name);
    if (found.length === 0) {
      problems.push(
        `${name} is a dependency in package.json but not a component`,
      );
      continue;
    }
    if (!found.some((c) => c.scope === undefined || c.scope === 'required')) {
      problems.push(
        `${name} is a dependency but no component for it is scope "required"`,
      );
    }
    if (rootEdges && !found.some((c) => dependsOn.has(String(c['bom-ref'])))) {
      problems.push(
        `${name} is a dependency but the package does not depend on it in the SBOM`,
      );
    }
  }

  // The package depends on nothing it does not declare for runtime. A dev
  // dependency here means the bill describes the build, not the install.
  const declared = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ]);
  const byRef = new Map(components.map((c) => [String(c['bom-ref']), c]));
  for (const ref of dependsOn) {
    const name = byRef.get(ref)?.name;
    if (name === undefined) {
      problems.push(`the package depends on ${ref}, which is not a component`);
    } else if (!declared.has(String(name))) {
      problems.push(
        `the package depends on ${String(name)}, which package.json declares only for development`,
      );
    }
  }

  return problems;
}
