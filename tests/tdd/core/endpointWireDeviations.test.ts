/**
 * Where a custom endpoint definition sends something its operation in the
 * vendored ESI spec does not describe: a query parameter the spec does not
 * list, or a body for an operation without one, or none where it has one.
 * Each such difference is a decision, so it is listed here with its reason,
 * and a new one fails until it is (option D step 2, #672).
 *
 * Every definition names its operation (fromOperation), so the comparison is
 * by operationId.
 */
import * as fs from 'fs';
import * as path from 'path';
import type {
  EndpointDefinition,
  EndpointMap,
} from '../../../src/core/endpoints/EndpointDefinition';
import { esiOperations } from '../../../src/core/endpoints/esi-operations.generated';

const ROOT = path.resolve(__dirname, '../../..');
const ENDPOINTS_DIR = path.join(ROOT, 'src/core/endpoints');
const SPEC = path.join(
  ROOT,
  'tests/contract/snapshots/esi-openapi.snapshot.json',
);

/**
 * The deliberate differences, by `<map>.<method>`. Remove an entry when the
 * definition and the spec agree again.
 */
const DEVIATIONS: Record<string, string> = {
  'fleetEndpoints.createFleetWing':
    'body: the spec defines none, and the method passes a caller-supplied body through; kept so 12.x call sites keep compiling',
  'freelanceJobsEndpoints.getCharacterFreelanceJobs':
    'query before/after: the spec at the vendored compatibility date does not page this route; the method keeps its cursor arguments so 12.x call sites keep compiling',
};

/** Query parameters the pipeline supplies itself, not the method's arguments. */
const PIPELINE_QUERY = new Set(['datasource', 'language', 'page', 'token']);

type Parameter = { $ref?: string; in?: string; name?: string };
type Operation = {
  operationId?: string;
  parameters?: Parameter[];
  requestBody?: unknown;
};

function specOperations(): Map<string, { query: string[]; body: boolean }> {
  const doc = JSON.parse(fs.readFileSync(SPEC, 'utf8')) as {
    paths: Record<
      string,
      Record<string, Operation> & { parameters?: Parameter[] }
    >;
    components?: { parameters?: Record<string, Parameter> };
  };
  const shared = doc.components?.parameters ?? {};
  const resolve = (p: Parameter): Parameter =>
    p.$ref ? (shared[p.$ref.split('/').pop()!] ?? {}) : p;
  const out = new Map<string, { query: string[]; body: boolean }>();
  for (const item of Object.values(doc.paths)) {
    for (const [method, value] of Object.entries(item)) {
      const op = value as Operation;
      if (method === 'parameters' || !op.operationId) continue;
      const params = [...(item.parameters ?? []), ...(op.parameters ?? [])].map(
        resolve,
      );
      out.set(op.operationId, {
        query: params.filter((p) => p.in === 'query').map((p) => p.name!),
        body: op.requestBody !== undefined,
      });
    }
  }
  return out;
}

function definitions(): Array<[string, EndpointDefinition]> {
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

/** What a definition sends that its spec operation does not describe, or `[]`. */
function differences(
  def: EndpointDefinition,
  spec: { query: string[]; body: boolean },
): string[] {
  const cursor =
    def.operation !== undefined &&
    (esiOperations as Record<string, { pagination: string }>)[def.operation]
      ?.pagination === 'cursor';
  const found: string[] = [];
  for (const key of Object.values(def.queryParams ?? {})) {
    // A cursor route's before/after tokens are the caller's to pass.
    if (cursor && (key === 'before' || key === 'after')) continue;
    if (!PIPELINE_QUERY.has(key) && !spec.query.includes(key)) {
      found.push(`query ${key}`);
    }
  }
  const sendsBody = def.hasBody === true || def.bodyBuilder !== undefined;
  if (sendsBody !== spec.body) {
    found.push(sendsBody ? 'body the spec does not define' : 'no body');
  }
  return found;
}

describe('custom endpoint definitions on the wire (option D step 2)', () => {
  const spec = specOperations();
  const defs = definitions();

  it('name an operation the vendored spec or the overlay defines', () => {
    const unknown = defs
      .filter(
        ([, def]) =>
          def.operation === undefined || !(def.operation in esiOperations),
      )
      .map(([name]) => name);
    expect(unknown).toEqual([]);
  });

  it('send only what their operation describes, apart from the listed deviations', () => {
    const found = Object.fromEntries(
      defs.flatMap(([name, def]) => {
        const op = spec.get(def.operation ?? '');
        // The overlay's routes (meta/openapi.*) are not in the vendored document.
        if (!op) return [];
        const diff = differences(def, op);
        return diff.length > 0 ? [[name, diff.join(', ')]] : [];
      }),
    );
    expect(Object.keys(found).sort()).toEqual(Object.keys(DEVIATIONS).sort());
  });
});
