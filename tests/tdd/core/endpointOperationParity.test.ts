/**
 * The custom endpoint definitions (src/core/endpoints/*Endpoints.ts) and the
 * generated operations (src/generated/operations.generated.ts) describe the
 * same ESI routes. Where both carry a fact about a route that changes what a
 * call does, they must agree, so a custom client and createEsi behave the
 * same way for it:
 *
 * - deprecation: a custom definition carries DeprecationInfo exactly when the
 *   spec deprecates the operation, with the same message and sunset date as
 *   scripts/spec/operation-overlay.json gives it;
 * - a text response, and the Accept header that asks for it;
 * - no content read as an empty list (emptyWhenNoContent).
 *
 * The custom maps stay hand-written (posture 1, guides/CLIENT-ARCHITECTURE.md)
 * and src/core may not import the generated layer (lint:layers), so this test
 * is what keeps the two in step. A spec refresh that deprecates an operation
 * fails here until its custom endpoint carries the same guidance.
 */
import * as fs from 'fs';
import * as path from 'path';
import type {
  EndpointDefinition,
  EndpointMap,
} from '../../../src/core/endpoints/EndpointDefinition';
import type { OperationMeta } from '../../../src/core/ports/OperationTransport';
import * as operations from '../../../src/generated/operations.generated';

const ENDPOINTS_DIR = path.resolve(__dirname, '../../../src/core/endpoints');

/** `GET contracts/public/bids/{}`: the route, whatever its placeholders are called. */
function routeKey(method: string, template: string): string {
  const route = template
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .replace(/\{[^}]+\}/g, '{}');
  return `${method} ${route}`;
}

function generatedMetas(): Map<string, OperationMeta> {
  const metas = new Map<string, OperationMeta>();
  for (const value of Object.values(operations) as unknown[]) {
    if (
      value !== null &&
      typeof value === 'object' &&
      'operationId' in value &&
      'path' in value
    ) {
      const meta = value as OperationMeta;
      metas.set(routeKey(meta.method, meta.path), meta);
    }
  }
  return metas;
}

function customDefinitions(): Array<[string, EndpointDefinition]> {
  const defs: Array<[string, EndpointDefinition]> = [];
  for (const file of fs.readdirSync(ENDPOINTS_DIR).sort()) {
    if (!file.endsWith('Endpoints.ts')) continue;
    const mod = require(path.join(ENDPOINTS_DIR, file)) as Record<
      string,
      EndpointMap
    >;
    for (const map of Object.values(mod)) {
      for (const [name, def] of Object.entries(map)) {
        defs.push([`${file.replace(/\.ts$/, '')}.${name}`, def]);
      }
    }
  }
  return defs;
}

describe('custom endpoint definitions agree with the generated operations (ARCH-08)', () => {
  const metas = generatedMetas();
  const paired = customDefinitions().flatMap(([name, def]) => {
    const meta = metas.get(routeKey(def.method, def.path));
    return meta ? [{ name, def, meta }] : [];
  });

  it('pairs the custom definitions with their operations', () => {
    // Every custom route ESI documents has an operation; a handful of custom
    // definitions share one route, so this is a floor, not an exact count.
    expect(paired.length).toBeGreaterThanOrEqual(230);
    const names = paired.map((p) => p.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'metaEndpoints.getOpenApiJson',
        'metaEndpoints.getOpenApiYaml',
        'contractEndpoints.getPublicContractBids',
        'contractEndpoints.getPublicContractItems',
      ]),
    );
  });

  it('read no content as an empty list on the same routes', () => {
    const disagree = paired
      .filter(
        ({ def, meta }) =>
          (def.emptyWhenNoContent === true) !==
          (meta.emptyWhenNoContent === true),
      )
      .map(({ name, meta }) => `${name} / ${meta.operationId}`);
    expect(disagree).toEqual([]);
    expect(
      paired.filter(({ def }) => def.emptyWhenNoContent).map((p) => p.name),
    ).toEqual([
      'contractEndpoints.getPublicContractBids',
      'contractEndpoints.getPublicContractItems',
    ]);
  });

  it('read the same routes as text, asking with the same Accept header', () => {
    const disagree = paired
      .filter(
        ({ def, meta }) =>
          def.textResponse?.accept !== meta.textResponse?.accept,
      )
      .map(({ name, meta }) => `${name} / ${meta.operationId}`);
    expect(disagree).toEqual([]);
    expect(
      paired.filter(({ def }) => def.textResponse).map((p) => p.name),
    ).toEqual(['metaEndpoints.getOpenApiYaml']);
  });

  it('deprecate the same routes, with the same message and sunset date', () => {
    const disagree = paired
      .filter(({ def, meta }) => {
        if (Boolean(def.deprecated) !== meta.deprecated) return true;
        if (!def.deprecated) return false;
        return (
          def.deprecated.message !== meta.deprecation?.message ||
          def.deprecated.sunsetDate !== meta.deprecation?.sunsetDate
        );
      })
      .map(({ name, meta }) => `${name} / ${meta.operationId}`);
    expect(disagree).toEqual([]);
  });
});
