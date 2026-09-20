import { createRequire } from 'node:module';
import type * as JsYaml from 'js-yaml';
import type AdmZip from 'adm-zip';
import { SdeError } from './errors';

/**
 * Loads js-yaml and adm-zip, the optional peer dependencies of
 * `@lgriffin/esi.ts/sde`, on first use instead of at import time, so the
 * entry point loads in an install that has neither.
 *
 * The loading is synchronous because `SdeDataProvider.fromDirectory` and
 * `fromZip` are. `require` is created from this file's location so the peers
 * resolve from wherever the package is installed: in the CommonJS bundle
 * `__filename` is Node's own; in the ES module bundle tsup's `shims` option
 * defines it from `import.meta.url`.
 */

type OptionalPeer = 'js-yaml' | 'adm-zip';

type RequireFn = (id: string) => unknown;

const requireFromPackage: RequireFn = createRequire(__filename);

function isMissing(err: unknown, peer: OptionalPeer): boolean {
  if (!(err instanceof Error)) return false;
  const code = (err as NodeJS.ErrnoException).code;
  // A MODULE_NOT_FOUND raised for something inside the peer is not "missing".
  return (
    (code === 'MODULE_NOT_FOUND' || code === 'ERR_MODULE_NOT_FOUND') &&
    err.message.includes(`'${peer}'`)
  );
}

/**
 * Requires an optional peer. When it is not installed, throws an `SdeError`
 * naming the package, what needs it and the command that installs it. Any
 * other failure while loading the peer is rethrown unchanged.
 */
export function requireOptionalPeer<T>(
  peer: OptionalPeer,
  neededFor: string,
  load: RequireFn = requireFromPackage,
): T {
  try {
    return load(peer) as T;
  } catch (err) {
    if (isMissing(err, peer)) {
      throw new SdeError(
        `${peer} is required to ${neededFor}. It is an optional peer dependency of @lgriffin/esi.ts; install it with: npm install ${peer}`,
      );
    }
    throw err;
  }
}

export function loadJsYaml(): typeof JsYaml {
  return requireOptionalPeer<typeof JsYaml>('js-yaml', 'parse SDE YAML files');
}

export function loadAdmZip(): typeof AdmZip {
  return requireOptionalPeer<typeof AdmZip>('adm-zip', 'read SDE ZIP archives');
}
