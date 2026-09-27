/**
 * CHARTER ARCH-06: importing the package constructs nothing. No pino
 * instance is built when an entry point loads; the default logger builds
 * one on its first use, and `package.json` declares `"sideEffects": false`
 * so a bundler may drop every module a consumer does not use.
 *
 * Each test loads the source graph in a fresh module registry with pino
 * replaced by a spy that forwards to the real factory, so the Jest setup
 * file's own imports do not hide a construction.
 */
import { buildSync } from 'esbuild';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { ILogger } from '../../../src/core/logger/ILogger';

const ROOT = path.resolve(__dirname, '../../..');

/** Every `package.json` `exports` entry, by its source file. */
const ENTRIES = [
  'src/index.ts',
  'src/schemas/index.ts',
  'src/errors.ts',
  'src/testing/index.ts',
  'src/client/index.ts',
  'src/sde/index.ts',
  'src/sde/memory.ts',
];

type PinoSpy = jest.Mock<unknown, unknown[]>;

/** Load `load` in a fresh registry with pino spied; returns the spy. */
function withPinoSpy<T>(load: () => T): { pino: PinoSpy; loaded: T } {
  let pino!: PinoSpy;
  let loaded!: T;
  jest.isolateModules(() => {
    const actual = jest.requireActual<(...a: unknown[]) => unknown>('pino');
    pino = jest.fn((...args: unknown[]) => actual(...args));
    jest.doMock('pino', () => pino);
    loaded = load();
  });
  jest.dontMock('pino');
  return { pino, loaded };
}

const requireSource = (file: string): unknown =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require(path.join(ROOT, file));

const loadDefaultLogger = (): ILogger =>
  (
    requireSource('src/core/logger/DefaultLogger.ts') as {
      defaultLogger: ILogger;
    }
  ).defaultLogger;

describe('import-time side effects (ARCH-06)', () => {
  const savedLevel = process.env.ESI_LOG_LEVEL;
  afterEach(() => {
    if (savedLevel === undefined) delete process.env.ESI_LOG_LEVEL;
    else process.env.ESI_LOG_LEVEL = savedLevel;
  });

  it('importing the root entry constructs no pino logger', () => {
    const { pino, loaded } = withPinoSpy(() => requireSource('src/index.ts'));
    expect(Object.keys(loaded as object)).toContain('EsiClient');
    expect(pino).not.toHaveBeenCalled();
  });

  it.each(ENTRIES)('importing %s constructs no pino logger', (entry) => {
    const { pino } = withPinoSpy(() => requireSource(entry));
    expect(pino).not.toHaveBeenCalled();
  });

  it('builds the default logger once, on first use, then delegates directly', () => {
    const { pino, loaded: logger } = withPinoSpy(loadDefaultLogger);
    const lazyWarn = logger.warn;

    expect(logger.isLevelEnabled?.('trace')).toBe(false);
    expect(pino).toHaveBeenCalledTimes(1);

    // The methods were replaced by the built logger's: no wrapper remains.
    expect(logger.warn).not.toBe(lazyWarn);
    logger.isLevelEnabled?.('warn');
    logger.debug('below the default level');
    expect(pino).toHaveBeenCalledTimes(1);
  });

  it('methods saved before first use build the logger once', () => {
    process.env.ESI_LOG_LEVEL = 'silent';
    const { pino, loaded: logger } = withPinoSpy(loadDefaultLogger);
    const { warn, isLevelEnabled } = logger;

    for (let i = 0; i < 3; i++) {
      warn('not written: the level is silent');
      expect(isLevelEnabled?.('warn')).toBe(false);
    }
    expect(pino).toHaveBeenCalledTimes(1);
  });

  it('a level method is a first use too', () => {
    process.env.ESI_LOG_LEVEL = 'silent';
    const { pino, loaded: logger } = withPinoSpy(loadDefaultLogger);
    logger.error('not written: the level is silent');
    expect(pino).toHaveBeenCalledTimes(1);
  });

  it('reads ESI_LOG_LEVEL when the logger is built, not at import', () => {
    delete process.env.ESI_LOG_LEVEL;
    const { pino, loaded: logger } = withPinoSpy(loadDefaultLogger);
    process.env.ESI_LOG_LEVEL = 'debug';

    expect(logger.isLevelEnabled?.('debug')).toBe(true);
    expect(pino).toHaveBeenCalledWith({ level: 'debug' });
  });

  it('an invalid ESI_LOG_LEVEL no longer throws on import, only on first use', () => {
    process.env.ESI_LOG_LEVEL = 'not-a-level';
    const { loaded: logger } = withPinoSpy(() => {
      requireSource('src/index.ts');
      return loadDefaultLogger();
    });
    expect(() => logger.isLevelEnabled?.('warn')).toThrow(/not-a-level/);
  });

  it('package.json declares "sideEffects": false', () => {
    const manifest = JSON.parse(
      readFileSync(path.join(ROOT, 'package.json'), 'utf8'),
    ) as { sideEffects?: unknown };
    expect(manifest.sideEffects).toBe(false);
  });

  // The bundler's view: a consumer importing only an error class gets no
  // logger code and no pino import. Both the lazy default and the manifest
  // flag are needed for this; either one alone keeps pino in the bundle.
  it.each(['esm', 'cjs'] as const)(
    'a bundle of `import { EsiError }` from the root entry reaches no pino (%s)',
    (format) => {
      const result = buildSync({
        stdin: {
          contents: `import { EsiError } from './src/index.ts';\nexport { EsiError };\n`,
          resolveDir: ROOT,
          loader: 'ts',
        },
        bundle: true,
        write: false,
        platform: 'node',
        target: 'es2022',
        format,
        external: ['pino', 'zod', 'better-sqlite3', 'adm-zip', 'js-yaml'],
        logLevel: 'silent',
      });
      const text = result.outputFiles.map((f) => f.text).join('\n');
      expect(text).toMatch(/EsiError = class extends Error/);
      expect(text).not.toMatch(/["']pino["']/);
    },
  );
});
