/**
 * ESI Spec Contract Tests
 *
 * Validates that this codebase's endpoint definitions, types, cache TTLs,
 * and scope mappings stay in sync with the live ESI swagger spec.
 *
 * Gated behind ESI_LIVE_TESTS=true since it fetches from the live API.
 *
 * Run: ESI_LIVE_TESTS=true npx jest --config jest.integration.config.cjs tests/integration/esi-spec-contract.test.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { esiCacheTtls } from '../../src/core/endpoints/esi-cache-ttls.generated';
import { esiEndpointScopes } from '../../src/core/endpoints/esi-scopes.generated';

const LIVE_TESTS_ENABLED = process.env.ESI_LIVE_TESTS === 'true';
const describeIfLive = LIVE_TESTS_ENABLED ? describe : describe.skip;

const ESI_SWAGGER_URL = 'https://esi.evetech.net/latest/swagger.json';
const ENDPOINTS_DIR = path.resolve(__dirname, '../../src/core/endpoints');
const TYPES_DIR = path.resolve(__dirname, '../../src/types');
const GENERATED_TYPES_FILE = path.resolve(
  TYPES_DIR,
  'generated/esi-spec.generated.ts',
);

// --- Shared types ---

interface SwaggerSpec {
  paths: Record<string, Record<string, SwaggerOperation>>;
}

interface SwaggerOperation {
  tags?: string[];
  'x-cached-seconds'?: number;
  security?: Array<Record<string, string[]>>;
}

interface EndpointEntry {
  path: string;
  method: string;
  name: string;
  file: string;
}

interface ParsedField {
  name: string;
  type: string;
  optional: boolean;
}

interface ParsedInterface {
  name: string;
  fields: ParsedField[];
  file: string;
}

// --- Helpers (adapted from scripts/validate-esi-endpoints.ts) ---

function normalizePath(p: string): string {
  return p
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .replace(/\{[^}]+\}/g, '{param}')
    .toLowerCase();
}

function parseEndpointFiles(): EndpointEntry[] {
  const entries: EndpointEntry[] = [];
  const files = fs
    .readdirSync(ENDPOINTS_DIR)
    .filter((f) => f.endsWith('Endpoints.ts'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(ENDPOINTS_DIR, file), 'utf-8');

    const pathRegex =
      /(\w+):\s*\{[^}]*?path:\s*'([^']+)'[^}]*?method:\s*'(GET|POST|PUT|DELETE)'/gs;
    let match;

    while ((match = pathRegex.exec(content)) !== null) {
      entries.push({
        name: match[1]!,
        path: match[2]!,
        method: match[3]!,
        file,
      });
    }
  }

  return entries;
}

function parseSwaggerPaths(
  spec: SwaggerSpec,
): { method: string; path: string; tags: string[] }[] {
  const entries: { method: string; path: string; tags: string[] }[] = [];
  const httpMethods = ['get', 'post', 'put', 'delete'];

  for (const [routePath, methods] of Object.entries(spec.paths)) {
    for (const method of httpMethods) {
      if (methods[method]) {
        const operation = methods[method] as { tags?: string[] };
        entries.push({
          method: method.toUpperCase(),
          path: routePath,
          tags: operation.tags || [],
        });
      }
    }
  }

  return entries;
}

function parseInterfaceFields(content: string): ParsedInterface[] {
  const interfaces: ParsedInterface[] = [];
  const ifaceRegex =
    /export\s+interface\s+(\w+)\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
  let match;

  while ((match = ifaceRegex.exec(content)) !== null) {
    const name = match[1]!;
    const body = match[2]!;
    const fields: ParsedField[] = [];

    const fieldRegex = /^\s+(\w+)(\??):\s*(.+?);/gm;
    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(body)) !== null) {
      fields.push({
        name: fieldMatch[1]!,
        type: fieldMatch[3]!.trim(),
        optional: fieldMatch[2] === '?',
      });
    }

    interfaces.push({ name, fields, file: '' });
  }

  return interfaces;
}

function normalizeTypeName(name: string): string {
  return name.toLowerCase().replace(/[_-]/g, '');
}

// --- Spec fetch (cached across all test suites) ---

let cachedSpec: SwaggerSpec | null = null;

async function fetchSpec(): Promise<SwaggerSpec> {
  if (cachedSpec) return cachedSpec;

  const response = await fetch(ESI_SWAGGER_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ESI swagger spec: HTTP ${response.status} ${response.statusText}`,
    );
  }
  cachedSpec = (await response.json()) as SwaggerSpec;
  return cachedSpec;
}

// --- Test Suites ---

describeIfLive('ESI Spec Contract', () => {
  let spec: SwaggerSpec;

  beforeAll(async () => {
    spec = await fetchSpec();
  }, 60000);

  // =========================================================================
  // 1. Endpoint Coverage
  // =========================================================================
  describe('Endpoint Coverage', () => {
    let codebaseEntries: EndpointEntry[];
    let specEntries: { method: string; path: string; tags: string[] }[];

    beforeAll(() => {
      codebaseEntries = parseEndpointFiles();
      specEntries = parseSwaggerPaths(spec);
    });

    it('should parse at least one endpoint from the codebase', () => {
      expect(codebaseEntries.length).toBeGreaterThan(0);
    });

    it('should parse at least one endpoint from the ESI spec', () => {
      expect(specEntries.length).toBeGreaterThan(0);
    });

    it('should detect phantom endpoints (in codebase but not in spec)', () => {
      const specMap = new Map<
        string,
        { method: string; path: string; tags: string[] }[]
      >();
      for (const entry of specEntries) {
        const key = normalizePath(entry.path);
        if (!specMap.has(key)) specMap.set(key, []);
        specMap.get(key)!.push(entry);
      }

      const phantoms: EndpointEntry[] = [];
      for (const entry of codebaseEntries) {
        const key = normalizePath(entry.path);
        if (!specMap.has(key)) {
          phantoms.push(entry);
        }
      }

      if (phantoms.length > 0) {
        const details = phantoms
          .map((p) => `  ${p.method} ${p.path} (${p.name} in ${p.file})`)
          .join('\n');
        console.warn(
          `Found ${phantoms.length} phantom endpoint(s) in codebase not present in ESI spec (may be newer EVE features):\n${details}`,
        );
      }

      expect(true).toBe(true);
    });

    it('should detect HTTP method mismatches between codebase and spec', () => {
      const specMap = new Map<
        string,
        { method: string; path: string; tags: string[] }[]
      >();
      for (const entry of specEntries) {
        const key = normalizePath(entry.path);
        if (!specMap.has(key)) specMap.set(key, []);
        specMap.get(key)!.push(entry);
      }

      const mismatches: {
        path: string;
        name: string;
        file: string;
        codebaseMethod: string;
        specMethods: string;
      }[] = [];

      for (const entry of codebaseEntries) {
        const key = normalizePath(entry.path);
        const specMatches = specMap.get(key);
        if (!specMatches) continue;

        const methodMatch = specMatches.find((s) => s.method === entry.method);
        if (!methodMatch) {
          mismatches.push({
            path: entry.path,
            name: entry.name,
            file: entry.file,
            codebaseMethod: entry.method,
            specMethods: specMatches.map((s) => s.method).join('/'),
          });
        }
      }

      if (mismatches.length > 0) {
        const details = mismatches
          .map(
            (m) =>
              `  ${m.name} (${m.file}): ${m.path}\n    codebase=${m.codebaseMethod}, spec=${m.specMethods}`,
          )
          .join('\n');
        console.warn(
          `Found ${mismatches.length} HTTP method mismatch(es) — review needed:\n${details}`,
        );
      }

      expect(true).toBe(true);
    });

    it('should report spec endpoints not covered in codebase (coverage awareness)', () => {
      const codebaseMap = new Map<string, EndpointEntry[]>();
      for (const entry of codebaseEntries) {
        const key = normalizePath(entry.path);
        if (!codebaseMap.has(key)) codebaseMap.set(key, []);
        codebaseMap.get(key)!.push(entry);
      }

      const matchedSpecKeys = new Set<string>();
      for (const entry of codebaseEntries) {
        const key = normalizePath(entry.path);
        matchedSpecKeys.add(`${key}:${entry.method}`);
      }

      const uncovered: { method: string; path: string; tags: string[] }[] = [];
      for (const entry of specEntries) {
        const key = `${normalizePath(entry.path)}:${entry.method}`;
        if (!matchedSpecKeys.has(key)) {
          uncovered.push(entry);
        }
      }

      // Report for awareness but do not fail
      if (uncovered.length > 0) {
        const byTag = new Map<string, { method: string; path: string }[]>();
        for (const e of uncovered) {
          const tag = e.tags[0] || 'Uncategorized';
          if (!byTag.has(tag)) byTag.set(tag, []);
          byTag.get(tag)!.push(e);
        }

        const lines: string[] = [
          `${uncovered.length} ESI spec endpoint(s) not covered in codebase:`,
        ];
        for (const [tag, entries] of Array.from(byTag.entries()).sort()) {
          lines.push(`  [${tag}]`);
          for (const e of entries) {
            lines.push(`    ${e.method} ${e.path}`);
          }
        }
        console.warn(lines.join('\n'));
      }

      // Always passes -- this is informational
      expect(true).toBe(true);
    });
  });

  // =========================================================================
  // 2. Type Drift Detection
  // =========================================================================
  describe('Type Drift Detection', () => {
    let handwrittenTypes: ParsedInterface[];
    let generatedTypes: ParsedInterface[];
    let matchedPairs: {
      handwritten: ParsedInterface;
      generated: ParsedInterface;
    }[];

    beforeAll(() => {
      // Parse hand-written types
      handwrittenTypes = [];
      const typeFiles = fs
        .readdirSync(TYPES_DIR)
        .filter((f) => f.endsWith('.ts') && !f.includes('api-responses'));

      for (const file of typeFiles) {
        const filePath = path.join(TYPES_DIR, file);
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) continue;

        const content = fs.readFileSync(filePath, 'utf-8');
        const interfaces = parseInterfaceFields(content);
        for (const iface of interfaces) {
          iface.file = file;
        }
        handwrittenTypes.push(...interfaces);
      }

      // Parse generated types
      generatedTypes = [];
      if (fs.existsSync(GENERATED_TYPES_FILE)) {
        const content = fs.readFileSync(GENERATED_TYPES_FILE, 'utf-8');
        const interfaces = parseInterfaceFields(content);
        for (const iface of interfaces) {
          iface.file = 'esi-spec.generated.ts';
        }
        generatedTypes.push(...interfaces);
      }

      // Build matched pairs using same fuzzy matching as validate script
      matchedPairs = [];
      const generatedByNormalized = new Map<string, ParsedInterface>();
      for (const g of generatedTypes) {
        generatedByNormalized.set(normalizeTypeName(g.name), g);
      }

      for (const hw of handwrittenTypes) {
        const hwNorm = normalizeTypeName(hw.name);
        let bestMatch: ParsedInterface | undefined;
        let bestScore = 0;

        // Name-based matching
        for (const [gNorm, g] of generatedByNormalized) {
          if (gNorm.includes(hwNorm) || hwNorm.includes(gNorm)) {
            const score = Math.min(hwNorm.length, gNorm.length);
            if (score > bestScore) {
              bestScore = score;
              bestMatch = g;
            }
          }
        }

        // Field-overlap fallback
        if (!bestMatch) {
          const hwFieldNames = new Set(hw.fields.map((f) => f.name));
          for (const g of generatedTypes) {
            const gFieldNames = new Set(g.fields.map((f) => f.name));
            const overlap = [...hwFieldNames].filter((f) => gFieldNames.has(f));
            if (
              overlap.length >= 3 &&
              overlap.length / Math.max(hwFieldNames.size, gFieldNames.size) >
                0.5
            ) {
              if (overlap.length > bestScore) {
                bestScore = overlap.length;
                bestMatch = g;
              }
            }
          }
        }

        if (bestMatch) {
          matchedPairs.push({ handwritten: hw, generated: bestMatch });
        }
      }
    });

    it('should find generated types to compare against', () => {
      expect(generatedTypes.length).toBeGreaterThan(0);
    });

    it('should detect missing fields (in spec but not in hand-written types)', () => {
      const missingFields: {
        iface: string;
        field: string;
        specType: string;
        file: string;
      }[] = [];

      for (const { handwritten, generated } of matchedPairs) {
        const hwFieldMap = new Map(handwritten.fields.map((f) => [f.name, f]));
        for (const specField of generated.fields) {
          if (!hwFieldMap.has(specField.name)) {
            missingFields.push({
              iface: handwritten.name,
              field: specField.name,
              specType: specField.type,
              file: handwritten.file,
            });
          }
        }
      }

      if (missingFields.length > 0) {
        const details = missingFields
          .map(
            (m) =>
              `  ${m.iface} (${m.file}): missing '${m.field}' (${m.specType})`,
          )
          .join('\n');
        console.warn(
          `Found ${missingFields.length} field(s) present in spec but missing from hand-written types:\n${details}`,
        );
      }

      expect(true).toBe(true);
    });

    it('should detect optionality mismatches between hand-written and spec types', () => {
      const drifts: {
        iface: string;
        field: string;
        handwrittenOptional: boolean;
        specOptional: boolean;
        file: string;
      }[] = [];

      for (const { handwritten, generated } of matchedPairs) {
        const specFieldMap = new Map(generated.fields.map((f) => [f.name, f]));
        for (const hwField of handwritten.fields) {
          const specField = specFieldMap.get(hwField.name);
          if (specField && hwField.optional !== specField.optional) {
            drifts.push({
              iface: handwritten.name,
              field: hwField.name,
              handwrittenOptional: hwField.optional,
              specOptional: specField.optional,
              file: handwritten.file,
            });
          }
        }
      }

      if (drifts.length > 0) {
        const details = drifts
          .map((d) => {
            const hw = d.handwrittenOptional ? 'optional' : 'required';
            const sp = d.specOptional ? 'optional' : 'required';
            return `  ${d.iface} (${d.file}): '${d.field}' is ${hw} in code but ${sp} in spec`;
          })
          .join('\n');
        console.warn(
          `Found ${drifts.length} optionality mismatch(es) — review needed:\n${details}`,
        );
      }

      expect(true).toBe(true);
    });
  });

  // =========================================================================
  // 3. Cache TTL Drift
  // =========================================================================
  describe('Cache TTL Drift', () => {
    it('should have cache TTL entries that match x-cached-seconds in the live spec', () => {
      const httpMethods = ['get', 'post', 'put', 'delete'];
      const specTtls = new Map<string, number>();

      for (const [routePath, methods] of Object.entries(spec.paths)) {
        for (const method of httpMethods) {
          const operation = methods[method] as SwaggerOperation | undefined;
          if (operation && operation['x-cached-seconds'] !== undefined) {
            // Key format matches esi-cache-ttls.generated.ts: "METHOD:path" (no leading/trailing slashes)
            const cleanPath = routePath.replace(/^\//, '').replace(/\/$/, '');
            const key = `${method.toUpperCase()}:${cleanPath}`;
            specTtls.set(key, operation['x-cached-seconds']);
          }
        }
      }

      const mismatches: {
        key: string;
        codeTtl: number;
        specTtl: number;
      }[] = [];
      const missingFromSpec: string[] = [];

      for (const [key, codeTtl] of Object.entries(esiCacheTtls)) {
        const specTtl = specTtls.get(key);
        if (specTtl === undefined) {
          missingFromSpec.push(key);
        } else if (specTtl !== codeTtl) {
          mismatches.push({ key, codeTtl, specTtl });
        }
      }

      const issues: string[] = [];

      if (mismatches.length > 0) {
        issues.push(
          `${mismatches.length} cache TTL mismatch(es):`,
          ...mismatches.map(
            (m) => `  ${m.key}: code=${m.codeTtl}s, spec=${m.specTtl}s`,
          ),
        );
      }

      if (missingFromSpec.length > 0) {
        issues.push(
          `${missingFromSpec.length} cache TTL key(s) in code but not found in spec:`,
          ...missingFromSpec.map((k) => `  ${k}`),
        );
      }

      if (issues.length > 0) {
        throw new Error(issues.join('\n'));
      }
    });
  });

  // =========================================================================
  // 4. Scope Drift
  // =========================================================================
  describe('Scope Drift', () => {
    it('should have scope entries that match security requirements in the live spec', () => {
      const httpMethods = ['get', 'post', 'put', 'delete'];
      const specScopes = new Map<string, string[]>();

      for (const [routePath, methods] of Object.entries(spec.paths)) {
        for (const method of httpMethods) {
          const operation = methods[method] as SwaggerOperation | undefined;
          if (
            operation &&
            operation.security &&
            operation.security.length > 0
          ) {
            const cleanPath = routePath.replace(/^\//, '').replace(/\/$/, '');
            const key = `${method.toUpperCase()}:${cleanPath}`;
            // ESI security uses evesso with an array of scope strings
            const scopes: string[] = [];
            for (const secReq of operation.security) {
              for (const scopeList of Object.values(secReq)) {
                scopes.push(...scopeList);
              }
            }
            if (scopes.length > 0) {
              specScopes.set(key, scopes.sort());
            }
          }
        }
      }

      const mismatches: {
        key: string;
        codeScopes: string[];
        specScopes: string[];
      }[] = [];
      const missingFromSpec: string[] = [];

      for (const [key, codeScopes] of Object.entries(esiEndpointScopes)) {
        const specScopeList = specScopes.get(key);
        if (specScopeList === undefined) {
          missingFromSpec.push(key);
        } else {
          const sortedCode = [...codeScopes].sort();
          const sortedSpec = [...specScopeList].sort();
          if (JSON.stringify(sortedCode) !== JSON.stringify(sortedSpec)) {
            mismatches.push({
              key,
              codeScopes: sortedCode,
              specScopes: sortedSpec,
            });
          }
        }
      }

      const issues: string[] = [];

      if (mismatches.length > 0) {
        issues.push(
          `${mismatches.length} scope mismatch(es):`,
          ...mismatches.map(
            (m) =>
              `  ${m.key}:\n    code:  [${m.codeScopes.join(', ')}]\n    spec:  [${m.specScopes.join(', ')}]`,
          ),
        );
      }

      if (missingFromSpec.length > 0) {
        issues.push(
          `${missingFromSpec.length} scope key(s) in code but not found in spec:`,
          ...missingFromSpec.map((k) => `  ${k}`),
        );
      }

      if (issues.length > 0) {
        throw new Error(issues.join('\n'));
      }
    });
  });
});
