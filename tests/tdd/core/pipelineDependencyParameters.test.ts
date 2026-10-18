/**
 * CHARTER ARCH-03: the request-pipeline modules take the cache, rate limiter
 * and circuit breaker as parameters. They may import the interfaces and the
 * pure cache-key and write-log helpers, never an implementation; `dependencies.ts` is the
 * one module that resolves them.
 */
import { readFileSync, readdirSync } from 'fs';
import * as path from 'path';

const SRC_CORE = path.resolve(__dirname, '../../../src/core');
const PIPELINE = path.join(SRC_CORE, 'requestPipeline');
const RESOLVER = 'dependencies.ts';

/** Folders holding a strategy implementation next to its interface. */
const STRATEGY_DIRS = ['cache', 'rateLimiter', 'circuitBreaker'];

/**
 * Modules in those folders a stage may import: interfaces and pure helpers
 * (cache keys, and the per-cache write log keyed by the `ICache` it is given).
 */
const PURE_HELPERS = new Set(['cacheKey', 'writeLog']);

function allowed(module: string): boolean {
  return /^I[A-Z]/.test(module) || PURE_HELPERS.has(module);
}

/**
 * Relative specifiers a module loads at runtime: `import … from`, bare
 * side-effect imports and `export … from` re-exports. `import type` and
 * `export type` are erased, so they are left out.
 */
function runtimeSpecifiers(source: string): string[] {
  const imports = /^\s*import\s+(?!type\b)(?:[^;]*?\sfrom\s+)?'([^']+)'/gm;
  const reExports = /^\s*export\s+(?!type\b)[^;]*?\sfrom\s+'([^']+)'/gm;
  return [...source.matchAll(imports), ...source.matchAll(reExports)]
    .sort((a, b) => a.index - b.index)
    .map((m) => m[1]!)
    .filter((spec) => spec.startsWith('.'));
}

/**
 * The specifiers in `source` (a module at `file`, relative to the pipeline
 * folder) that reach a strategy implementation, or a strategy folder's
 * barrel, which could re-export one.
 */
function strategyImplementations(file: string, source: string): string[] {
  const from = path.dirname(path.join(PIPELINE, file));
  return runtimeSpecifiers(source).filter((spec) => {
    const parts = path
      .relative(SRC_CORE, path.resolve(from, spec))
      .split(path.sep);
    if (!STRATEGY_DIRS.includes(parts[0]!)) return false;
    return parts.length !== 2 || !allowed(parts[1]!);
  });
}

/** Every .ts file under the pipeline folder, subfolders included. */
function pipelineFiles(dir = PIPELINE): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) return pipelineFiles(abs);
    return entry.name.endsWith('.ts') ? [path.relative(PIPELINE, abs)] : [];
  });
}

const stages = pipelineFiles().filter((f) => f !== RESOLVER);

describe('ARCH-03: request-pipeline modules receive cache, rate limiter and circuit breaker as parameters', () => {
  it('finds the pipeline stages', () => {
    // An empty list would make the check below vacuous.
    expect(stages).toEqual(
      expect.arrayContaining(['fetchExecution.ts', 'cachePolicy.ts']),
    );
  });

  it.each(stages)(
    '%s loads no cache, rate limiter or circuit breaker implementation',
    (file) => {
      const source = readFileSync(path.join(PIPELINE, file), 'utf8');
      expect(strategyImplementations(file, source)).toEqual([]);
    },
  );

  it('reads the imports a real stage has', () => {
    // Guards the parser: fetchExecution.ts imports all three interfaces.
    const source = readFileSync(
      path.join(PIPELINE, 'fetchExecution.ts'),
      'utf8',
    );
    expect(runtimeSpecifiers(source)).toEqual(
      expect.arrayContaining([
        '../cache/ICache',
        '../rateLimiter/IRateLimiter',
        '../circuitBreaker/ICircuitBreaker',
      ]),
    );
  });

  it('catches every way a planted stage could load an implementation', () => {
    const planted = [
      "import { RateLimiter } from '../rateLimiter/RateLimiter';",
      "import '../circuitBreaker/CircuitBreaker';",
      "export { ETagCacheManager } from '../cache/ETagCacheManager';",
      "import * as cache from '../cache';",
      'import {',
      '  CircuitBreaker,',
      "} from '../circuitBreaker/CircuitBreaker';",
      "import type { RateLimiter as R } from '../rateLimiter/RateLimiter';",
      "import { ICache } from '../cache/ICache';",
      "import { buildCacheKey } from '../cache/cacheKey';",
    ].join('\n');
    expect(strategyImplementations('planted.ts', planted)).toEqual([
      '../rateLimiter/RateLimiter',
      '../circuitBreaker/CircuitBreaker',
      '../cache/ETagCacheManager',
      '../cache',
      '../circuitBreaker/CircuitBreaker',
    ]);
  });

  it('resolves a stage in a subfolder from its own directory', () => {
    expect(
      strategyImplementations(
        'nested/stage.ts',
        "import { RateLimiter } from '../../rateLimiter/RateLimiter';",
      ),
    ).toEqual(['../../rateLimiter/RateLimiter']);
  });
});
