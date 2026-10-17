/**
 * The custom endpoint definitions (src/core/endpoints/*Endpoints.ts) and the
 * generated operations (src/generated/operations.generated.ts) describe the
 * same ESI routes. Where both carry a fact about a route that changes what a
 * call does, they must agree, so a custom client and createEsi behave the
 * same way for it:
 *
 * - deprecation: a custom definition carries DeprecationInfo exactly when the
 *   spec deprecates the operation, with the same message, replacement (its
 *   method resolved to an operationId) and sunset date as
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

/**
 * The custom side names a replacement by method (`getNew`), the generated
 * side by operationId (`GetNew`). This resolves a method name to the
 * operationId of its route, looking in the endpoint map the deprecated
 * definition comes from.
 */
function operationIdOf(
  name: string,
  metas: Map<string, OperationMeta>,
): (method: string) => string | undefined {
  const file = name.slice(0, name.indexOf('.'));
  return (method) => {
    const found = customDefinitions().find(([n]) => n === `${file}.${method}`);
    if (!found) return undefined;
    return metas.get(routeKey(found[1].method, found[1].path))?.operationId;
  };
}

/**
 * Whether a custom definition and its operation disagree about deprecation:
 * one deprecated and not the other, or a different message, sunset date or
 * replacement (the custom method resolved to its operationId).
 */
function deprecationsDisagree(
  def: EndpointDefinition,
  meta: OperationMeta,
  resolveMethod: (method: string) => string | undefined,
): boolean {
  if (Boolean(def.deprecated) !== meta.deprecated) return true;
  if (!def.deprecated) return false;
  const generated = meta.deprecation ?? {};
  if (def.deprecated.message !== generated.message) return true;
  if (def.deprecated.sunsetDate !== generated.sunsetDate) return true;
  const replacement = def.deprecated.replacedBy
    ? resolveMethod(def.deprecated.replacedBy)
    : undefined;
  return replacement !== generated.replacedBy;
}

describe('custom endpoint definitions agree with the generated operations (ARCH-08)', () => {
  const metas = generatedMetas();
  const definitions = customDefinitions();
  const paired = definitions.flatMap(([name, def]) => {
    const meta = metas.get(routeKey(def.method, def.path));
    return meta ? [{ name, def, meta }] : [];
  });

  it('pairs every custom definition with an operation', () => {
    // An unpaired definition would escape every check below, so a route the
    // generator does not know (a typo, or one ESI dropped) fails here.
    const unpaired = definitions
      .filter(([, def]) => !metas.has(routeKey(def.method, def.path)))
      .map(([name, def]) => `${name} (${def.method} ${def.path})`);
    expect(unpaired).toEqual([]);
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

  it('deprecate the same routes, with the same message, replacement and sunset date', () => {
    const disagree = paired
      .filter(({ name, def, meta }) =>
        deprecationsDisagree(def, meta, operationIdOf(name, metas)),
      )
      .map(({ name, meta }) => `${name} / ${meta.operationId}`);
    expect(disagree).toEqual([]);
  });
});

describe('deprecationsDisagree (ARCH-08)', () => {
  const meta = (deprecation?: OperationMeta['deprecation']): OperationMeta => ({
    operationId: 'GetOld',
    method: 'GET',
    path: '/old',
    scopes: [],
    pagination: 'none',
    deprecated: deprecation !== undefined,
    ...(deprecation ? { deprecation } : {}),
    headers: [],
  });
  const def = (deprecated?: EndpointDefinition['deprecated']) =>
    ({
      path: 'old',
      method: 'GET',
      requiresAuth: false,
      ...(deprecated ? { deprecated } : {}),
    }) as EndpointDefinition;
  const guidance = { message: 'Gone.', sunsetDate: '2027-01-01' };
  const toNew = (method: string) =>
    method === 'getNew' ? 'GetNew' : undefined;

  it('agrees when neither is deprecated', () => {
    expect(deprecationsDisagree(def(), meta(), toNew)).toBe(false);
  });

  it('agrees when both name the same replacement', () => {
    expect(
      deprecationsDisagree(
        def({ ...guidance, replacedBy: 'getNew' }),
        meta({ ...guidance, replacedBy: 'GetNew' }),
        toNew,
      ),
    ).toBe(false);
  });

  it('disagrees when only one side is deprecated', () => {
    expect(deprecationsDisagree(def(guidance), meta(), toNew)).toBe(true);
    expect(deprecationsDisagree(def(), meta(guidance), toNew)).toBe(true);
  });

  it('disagrees on a different message or sunset date', () => {
    expect(
      deprecationsDisagree(
        def({ ...guidance, message: 'Other.' }),
        meta(guidance),
        toNew,
      ),
    ).toBe(true);
    expect(
      deprecationsDisagree(
        def({ ...guidance, sunsetDate: '2028-01-01' }),
        meta(guidance),
        toNew,
      ),
    ).toBe(true);
  });

  it('disagrees when the replacements name different operations, or one names none', () => {
    expect(
      deprecationsDisagree(
        def({ ...guidance, replacedBy: 'getNew' }),
        meta({ ...guidance, replacedBy: 'GetOther' }),
        toNew,
      ),
    ).toBe(true);
    expect(
      deprecationsDisagree(
        def(guidance),
        meta({ ...guidance, replacedBy: 'GetNew' }),
        toNew,
      ),
    ).toBe(true);
    expect(
      deprecationsDisagree(
        def({ ...guidance, replacedBy: 'getMissing' }),
        meta({ ...guidance, replacedBy: 'GetNew' }),
        toNew,
      ),
    ).toBe(true);
  });
});
