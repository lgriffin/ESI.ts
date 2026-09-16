import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/schemas/index.ts',
    'src/errors.ts',
    'src/testing/index.ts',
    'src/sde/index.ts',
    'src/sde/memory.ts',
  ],
  format: ['cjs', 'esm'],
  dts: false,
  // Code shared by several entry points goes into chunk files that each entry
  // imports, in both formats. Without it every entry bundles its own copy of
  // the error classes, schemas and SDE providers, so `isEsiError` from
  // `./errors` misses an `EsiError` thrown by the root client (esi-v2s.15).
  // tests/consumer/runtime/parity.mjs fails if a shared export loses identity.
  splitting: true,
  clean: true,
  outDir: 'dist',
  target: 'es2022',
  sourcemap: true,
  external: ['pino', 'zod', 'better-sqlite3', 'adm-zip', 'js-yaml'],
});
