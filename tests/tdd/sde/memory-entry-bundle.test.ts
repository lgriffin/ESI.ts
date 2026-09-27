/**
 * `./sde/memory` is the entry point for consumers who bring their own data
 * and never install the optional peers (CHARTER ARCH-10). Its bundle must
 * therefore contain no file-system, YAML, ZIP or SQLite code: none of the
 * strings below may appear in it. The source graph is bundled here with
 * esbuild the way tsup bundles it (same entry, same externals, so a reached
 * peer keeps its import specifier), and the built `dist/` files are checked
 * too when they exist, so the test runs before and after `npm run build`.
 */
import { buildSync } from 'esbuild';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../../..');
const ENTRY = path.join(ROOT, 'src/sde/memory.ts');
const FORBIDDEN = ['node:fs', 'js-yaml', 'adm-zip', 'better-sqlite3'];
const EXTERNAL = ['pino', 'zod', 'better-sqlite3', 'adm-zip', 'js-yaml'];

function bundle(format: 'esm' | 'cjs'): string {
  const result = buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    write: false,
    platform: 'node',
    target: 'es2022',
    format,
    external: EXTERNAL,
    logLevel: 'silent',
  });
  return result.outputFiles.map((f) => f.text).join('\n');
}

function found(text: string): string[] {
  return FORBIDDEN.filter((needle) => text.includes(needle));
}

describe('./sde/memory bundle', () => {
  it.each(['esm', 'cjs'] as const)(
    'reaches no file-system, YAML, ZIP or SQLite code (%s)',
    (format) => {
      expect(found(bundle(format))).toEqual([]);
    },
  );

  // The same check on the shipped files, so a tsup configuration change
  // (an entry, a chunk, a shim) cannot pull a peer in unnoticed.
  const built = ['dist/sde/memory.mjs', 'dist/sde/memory.js']
    .map((file) => path.join(ROOT, file))
    .filter((file) => existsSync(file));
  (built.length > 0 ? it.each(built) : it.skip.each(built))(
    'the built %s contains none of the forbidden strings',
    (file) => {
      expect(found(readFileSync(file, 'utf8'))).toEqual([]);
    },
  );

  it('the check itself catches the strings it looks for', () => {
    expect(found("import yaml from 'js-yaml';")).toEqual(['js-yaml']);
  });
});
