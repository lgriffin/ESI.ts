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
  splitting: false,
  clean: true,
  outDir: 'dist',
  target: 'es2022',
  sourcemap: true,
  external: ['pino', 'zod', 'better-sqlite3', 'adm-zip', 'js-yaml'],
});
