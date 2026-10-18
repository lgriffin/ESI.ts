/**
 * The generated response schemas as the baseline of the custom endpoint
 * definitions (option D step 3, #673). Every definition names its operation,
 * and every operation with a JSON body has a generated schema in
 * src/schemas/generated, which the endpoint maps may import. A hand-written
 * `responseSchema` is then an override of that baseline: this suite runs
 * both over every recorded ESI payload, so each is known to accept what ESI
 * actually sends, and lists the payloads where the baseline (the spec) is
 * wrong about the wire.
 */
import * as fs from 'fs';
import * as path from 'path';
import type { z } from 'zod';
import type {
  EndpointDefinition,
  EndpointMap,
} from '../../../src/core/endpoints/EndpointDefinition';
import * as baseline from '../../../src/schemas/generated/responseSchemas.generated';
import { responseSchemas } from '../../../src/adapters/responseSchemas.generated';
import { listFixtureFiles, loadFixture } from '../../contract/recorded/fixture';

const ENDPOINTS_DIR = path.resolve(__dirname, '../../../src/core/endpoints');

/** Every endpoint definition, keyed `<file stem>.<name>` as the fixtures are. */
function definitions(): Map<string, EndpointDefinition> {
  const out = new Map<string, EndpointDefinition>();
  for (const file of fs.readdirSync(ENDPOINTS_DIR).sort()) {
    if (!file.endsWith('Endpoints.ts')) continue;
    const stem = file.replace(/Endpoints\.ts$/, '');
    const mod = require(path.join(ENDPOINTS_DIR, file)) as Record<
      string,
      EndpointMap
    >;
    for (const map of Object.values(mod)) {
      if (!map || typeof map !== 'object') continue;
      for (const [name, def] of Object.entries(map)) {
        out.set(`${stem}.${name}`, def);
      }
    }
  }
  return out;
}

const exportsByName = baseline as unknown as Record<string, z.ZodType>;
/** The baselines by operationId: each is exported as `<operationId>Schema`. */
const schemas: Record<string, z.ZodType> = Object.fromEntries(
  Object.entries(exportsByName).map(([name, schema]) => [
    name.replace(/Schema$/, ''),
    schema,
  ]),
);

/**
 * Recorded payloads the generated baseline rejects, by fixture, with what
 * the spec gets wrong. Each is a reason the hand-written override stays.
 * Remove an entry when the spec and the wire agree again.
 */
const BASELINE_REJECTS: Record<string, string> = {};

describe('generated baseline schemas (#673)', () => {
  const defs = definitions();

  it('gives every operation a definition names, and that returns JSON, a baseline the maps can import', () => {
    const missing: string[] = [];
    for (const [key, def] of defs) {
      if (!def.operation || def.textResponse) continue;
      if (!def.responseSchema) continue;
      if (!schemas[def.operation]) missing.push(`${key} (${def.operation})`);
    }
    expect(missing).toEqual([]);
  });

  it('has a baseline for every operation createEsi validates', () => {
    expect(Object.keys(schemas).sort()).toEqual(
      Object.keys(responseSchemas).sort(),
    );
  });

  describe('override and baseline over the recorded payloads', () => {
    const rows = listFixtureFiles().map((file) => {
      const fixture = loadFixture(file);
      return { key: fixture.endpoint, fixture };
    });

    it.each(rows)('$key', ({ key, fixture }) => {
      const def = defs.get(key);
      expect(def).toBeDefined();
      if (!def?.operation || def.textResponse) return;
      const base = schemas[def.operation];
      for (const page of fixture.pages) {
        if (page.status !== 200) continue;
        if (def.responseSchema) {
          expect(def.responseSchema.safeParse(page.body).success).toBe(true);
        }
        if (!base) continue;
        const accepted = base.safeParse(page.body);
        if (key in BASELINE_REJECTS) {
          expect(accepted.success).toBe(false);
        } else {
          expect(accepted.error?.issues ?? []).toEqual([]);
        }
      }
    });

    it('lists only fixtures that exist', () => {
      const keys = new Set(rows.map((r) => r.key));
      expect(Object.keys(BASELINE_REJECTS).filter((k) => !keys.has(k))).toEqual(
        [],
      );
    });
  });
});
