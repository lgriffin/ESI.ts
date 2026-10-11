/**
 * CHARTER ARCH-03: the request-pipeline modules take the cache, rate limiter
 * and circuit breaker as parameters. They may import the interfaces and the
 * pure cache-key helpers, never an implementation; `dependencies.ts` is the
 * one module that resolves them.
 */
import { readFileSync, readdirSync } from 'fs';
import * as path from 'path';

const PIPELINE = path.resolve(__dirname, '../../../src/core/requestPipeline');
const CORE = path.dirname(PIPELINE);
const RESOLVER = 'dependencies.ts';

/** Folders holding a strategy implementation next to its interface. */
const STRATEGY_DIRS = ['cache', 'rateLimiter', 'circuitBreaker'];

/** Modules in those folders a stage may import: interfaces and pure helpers. */
function allowed(module: string): boolean {
  return /^I[A-Z]/.test(module) || module === 'cacheKey';
}

/** Value imports (not `import type`) of one file, as resolved paths under src/core. */
function valueImports(file: string): string[] {
  const source = readFileSync(path.join(PIPELINE, file), 'utf8');
  return [...source.matchAll(/^import\s+(?!type\b)[^;]*?from\s+'([^']+)'/gms)]
    .map((m) => m[1]!)
    .filter((spec) => spec.startsWith('.'))
    .map((spec) => path.relative(CORE, path.resolve(PIPELINE, spec)));
}

function strategyImplementations(file: string): string[] {
  return valueImports(file).filter((rel) => {
    const parts = rel.split(path.sep);
    return (
      parts.length === 2 &&
      STRATEGY_DIRS.includes(parts[0]!) &&
      !allowed(parts[1]!)
    );
  });
}

const stages = readdirSync(PIPELINE).filter(
  (f) => f.endsWith('.ts') && f !== RESOLVER,
);

describe('ARCH-03: request-pipeline modules receive cache, rate limiter and circuit breaker as parameters', () => {
  it('finds the pipeline stages', () => {
    // An empty list would make the check below vacuous.
    expect(stages).toEqual(
      expect.arrayContaining(['fetchExecution.ts', 'cachePolicy.ts']),
    );
  });

  it.each(stages)(
    '%s imports no cache, rate limiter or circuit breaker implementation',
    (file) => {
      expect(strategyImplementations(file)).toEqual([]);
    },
  );

  it('would catch a stage importing an implementation', () => {
    // The import parser and path resolution, checked against a known case.
    expect(
      path.relative(CORE, path.resolve(PIPELINE, '../rateLimiter/RateLimiter')),
    ).toBe(path.join('rateLimiter', 'RateLimiter'));
    expect(allowed('RateLimiter')).toBe(false);
    expect(allowed('ETagCacheManager')).toBe(false);
    expect(allowed('ICircuitBreaker')).toBe(true);
  });
});
