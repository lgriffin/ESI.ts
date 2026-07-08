/**
 * ESI Spec Snapshot Tests
 *
 * Compares the saved OpenAPI spec snapshot against the live spec to detect
 * upstream changes from CCP. Reports diffs as warnings without failing.
 *
 * Run: ESI_LIVE_TESTS=true npx jest --config jest.contract.config.cjs esi-snapshot
 * Snapshot: npm run contract:snapshot
 */

import * as fs from 'fs';
import * as path from 'path';
import { fetchSpec, OpenApiSpec } from './helpers';

const LIVE_TESTS_ENABLED = process.env.ESI_LIVE_TESTS === 'true';
const describeIfLive = LIVE_TESTS_ENABLED ? describe : describe.skip;

const SNAPSHOT_PATH = path.resolve(
  __dirname,
  'snapshots/esi-openapi.snapshot.json',
);

function countOperations(spec: OpenApiSpec): number {
  let count = 0;
  for (const methods of Object.values(spec.paths)) {
    for (const key of Object.keys(methods)) {
      if (['get', 'post', 'put', 'delete'].includes(key)) count++;
    }
  }
  return count;
}

function extractCacheTtls(spec: OpenApiSpec): Map<string, number> {
  const ttls = new Map<string, number>();
  for (const [routePath, methods] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!['get', 'post', 'put', 'delete'].includes(method)) continue;
      const op = operation as { 'x-cache-age'?: number };
      if (op['x-cache-age'] !== undefined) {
        const cleanPath = routePath.replace(/^\//, '').replace(/\/$/, '');
        ttls.set(`${method.toUpperCase()}:${cleanPath}`, op['x-cache-age']);
      }
    }
  }
  return ttls;
}

describeIfLive('ESI Spec Snapshot Comparison', () => {
  let liveSpec: OpenApiSpec;
  let snapshotSpec: OpenApiSpec | null = null;

  beforeAll(async () => {
    liveSpec = await fetchSpec();

    if (fs.existsSync(SNAPSHOT_PATH)) {
      const content = fs.readFileSync(SNAPSHOT_PATH, 'utf-8');
      snapshotSpec = JSON.parse(content) as OpenApiSpec;
    }
  }, 60000);

  it('should have a snapshot file (run npm run contract:snapshot to create)', () => {
    if (!snapshotSpec) {
      console.warn(
        'No snapshot file found. Run "npm run contract:snapshot" to create one.',
      );
    }
    expect(true).toBe(true);
  });

  it('should report path count changes', () => {
    if (!snapshotSpec) return;

    const livePaths = Object.keys(liveSpec.paths).length;
    const snapshotPaths = Object.keys(snapshotSpec.paths).length;

    if (livePaths !== snapshotPaths) {
      console.warn(
        `Path count changed: snapshot=${snapshotPaths}, live=${livePaths} (${livePaths > snapshotPaths ? '+' : ''}${livePaths - snapshotPaths})`,
      );
    }

    expect(true).toBe(true);
  });

  it('should report operation count changes', () => {
    if (!snapshotSpec) return;

    const liveOps = countOperations(liveSpec);
    const snapshotOps = countOperations(snapshotSpec);

    if (liveOps !== snapshotOps) {
      console.warn(
        `Operation count changed: snapshot=${snapshotOps}, live=${liveOps} (${liveOps > snapshotOps ? '+' : ''}${liveOps - snapshotOps})`,
      );
    }

    expect(true).toBe(true);
  });

  it('should report added/removed paths', () => {
    if (!snapshotSpec) return;

    const livePaths = new Set(Object.keys(liveSpec.paths));
    const snapshotPaths = new Set(Object.keys(snapshotSpec.paths));

    const added = [...livePaths].filter((p) => !snapshotPaths.has(p));
    const removed = [...snapshotPaths].filter((p) => !livePaths.has(p));

    if (added.length > 0) {
      console.warn(`New paths in live spec:\n  ${added.join('\n  ')}`);
    }
    if (removed.length > 0) {
      console.warn(`Paths removed from live spec:\n  ${removed.join('\n  ')}`);
    }

    expect(true).toBe(true);
  });

  it('should report cache TTL changes', () => {
    if (!snapshotSpec) return;

    const liveTtls = extractCacheTtls(liveSpec);
    const snapshotTtls = extractCacheTtls(snapshotSpec);
    const changes: string[] = [];

    for (const [key, liveTtl] of liveTtls) {
      const snapshotTtl = snapshotTtls.get(key);
      if (snapshotTtl !== undefined && snapshotTtl !== liveTtl) {
        changes.push(`${key}: ${snapshotTtl}s → ${liveTtl}s`);
      }
    }

    if (changes.length > 0) {
      console.warn(`Cache TTL changes:\n  ${changes.join('\n  ')}`);
    }

    expect(true).toBe(true);
  });

  it('should report schema count changes', () => {
    if (!snapshotSpec) return;

    const liveSchemas = Object.keys(liveSpec.components?.schemas || {}).length;
    const snapshotSchemas = Object.keys(
      snapshotSpec.components?.schemas || {},
    ).length;

    if (liveSchemas !== snapshotSchemas) {
      console.warn(
        `Schema count changed: snapshot=${snapshotSchemas}, live=${liveSchemas}`,
      );
    }

    expect(true).toBe(true);
  });
});
