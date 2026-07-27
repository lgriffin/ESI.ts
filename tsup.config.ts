import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false,
  splitting: false,
  clean: true,
  outDir: 'dist',
  target: 'es2022',
  sourcemap: true,
  external: ['pino', 'zod'],
});
