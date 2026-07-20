/**
 * ESI Endpoint Validation Script
 *
 * Fetches the canonical ESI OpenAPI spec and compares it against
 * the endpoint definitions in this codebase. Reports mismatches,
 * missing coverage, and deprecated endpoints.
 *
 * Usage: npx ts-node scripts/validate-esi-endpoints.ts
 *        npm run validate:esi
 */

import * as fs from 'fs';
import * as path from 'path';

const ESI_OPENAPI_URL =
  'https://esi.evetech.net/meta/openapi.json?compatibility_date=2025-12-16';
const ENDPOINTS_DIR = path.resolve(__dirname, '../src/core/endpoints');
const TYPES_DIR = path.resolve(__dirname, '../src/types');
const GENERATED_TYPES_FILE = path.resolve(
  TYPES_DIR,
  'generated/esi-spec.generated.ts',
);

interface OpenApiSpec {
  paths: Record<string, Record<string, unknown>>;
}

interface EndpointEntry {
  path: string;
  method: string;
  name: string;
  file: string;
}

interface ValidationResult {
  inCodebaseOnly: EndpointEntry[];
  inSpecOnly: { method: string; path: string; tags: string[] }[];
  methodMismatches: {
    path: string;
    codebaseMethod: string;
    specMethod: string;
    file: string;
    name: string;
  }[];
  matched: number;
}

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

function parseOpenApiPaths(
  spec: OpenApiSpec,
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

function validate(
  codebaseEntries: EndpointEntry[],
  specEntries: { method: string; path: string; tags: string[] }[],
): ValidationResult {
  const result: ValidationResult = {
    inCodebaseOnly: [],
    inSpecOnly: [],
    methodMismatches: [],
    matched: 0,
  };

  const specMap = new Map<
    string,
    { method: string; path: string; tags: string[] }[]
  >();
  for (const entry of specEntries) {
    const key = normalizePath(entry.path);
    if (!specMap.has(key)) specMap.set(key, []);
    specMap.get(key)!.push(entry);
  }

  const codebaseMap = new Map<string, EndpointEntry[]>();
  for (const entry of codebaseEntries) {
    const key = normalizePath(entry.path);
    if (!codebaseMap.has(key)) codebaseMap.set(key, []);
    codebaseMap.get(key)!.push(entry);
  }

  const matchedSpecKeys = new Set<string>();

  for (const entry of codebaseEntries) {
    const key = normalizePath(entry.path);
    const specMatches = specMap.get(key);

    if (!specMatches) {
      result.inCodebaseOnly.push(entry);
      continue;
    }

    const methodMatch = specMatches.find((s) => s.method === entry.method);

    if (methodMatch) {
      result.matched++;
      matchedSpecKeys.add(`${key}:${entry.method}`);
    } else {
      const specMethods = specMatches.map((s) => s.method);
      result.methodMismatches.push({
        path: entry.path,
        codebaseMethod: entry.method,
        specMethod: specMethods.join('/'),
        file: entry.file,
        name: entry.name,
      });
      for (const sm of specMatches) {
        matchedSpecKeys.add(`${key}:${sm.method}`);
      }
    }
  }

  for (const entry of specEntries) {
    const key = `${normalizePath(entry.path)}:${entry.method}`;
    if (!matchedSpecKeys.has(key)) {
      const codeKey = normalizePath(entry.path);
      if (!codebaseMap.has(codeKey)) {
        result.inSpecOnly.push(entry);
      }
    }
  }

  return result;
}

function printReport(
  result: ValidationResult,
  codebaseCount: number,
  specCount: number,
): void {
  console.log('\n========================================');
  console.log('  ESI Endpoint Validation Report');
  console.log('========================================\n');

  console.log(`Codebase endpoints:  ${codebaseCount}`);
  console.log(`ESI spec endpoints:  ${specCount}`);
  console.log(`Matched:             ${result.matched}`);
  console.log('');

  let hasIssues = false;

  if (result.methodMismatches.length > 0) {
    hasIssues = true;
    console.log('--- METHOD MISMATCHES ---');
    for (const m of result.methodMismatches) {
      console.log(`  [MISMATCH] ${m.name} in ${m.file}`);
      console.log(`    Path:     ${m.path}`);
      console.log(`    Codebase: ${m.codebaseMethod}`);
      console.log(`    ESI Spec: ${m.specMethod}`);
      console.log('');
    }
  }

  if (result.inCodebaseOnly.length > 0) {
    hasIssues = true;
    console.log('--- IN CODEBASE BUT NOT IN ESI SPEC ---');
    console.log(
      '  (May be newer endpoints not yet in public spec, or removed endpoints)',
    );
    for (const e of result.inCodebaseOnly) {
      console.log(`  [EXTRA] ${e.method} ${e.path}  (${e.name} in ${e.file})`);
    }
    console.log('');
  }

  if (result.inSpecOnly.length > 0) {
    hasIssues = true;
    const byTag = new Map<string, typeof result.inSpecOnly>();
    for (const e of result.inSpecOnly) {
      const tag = e.tags[0] || 'Uncategorized';
      if (!byTag.has(tag)) byTag.set(tag, []);
      byTag.get(tag)!.push(e);
    }

    console.log('--- IN ESI SPEC BUT NOT IN CODEBASE ---');
    for (const [tag, entries] of Array.from(byTag.entries()).sort()) {
      console.log(`  [${tag}]`);
      for (const e of entries) {
        console.log(`    ${e.method} ${e.path}`);
      }
    }
    console.log('');
  }

  if (!hasIssues) {
    console.log('All endpoints match the ESI spec.\n');
  }

  console.log('========================================\n');
}

// --- Type drift detection ---

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

function parseHandwrittenTypes(): ParsedInterface[] {
  const all: ParsedInterface[] = [];
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
    all.push(...interfaces);
  }

  return all;
}

function parseGeneratedTypes(): ParsedInterface[] {
  if (!fs.existsSync(GENERATED_TYPES_FILE)) return [];
  const content = fs.readFileSync(GENERATED_TYPES_FILE, 'utf-8');
  const interfaces = parseInterfaceFields(content);
  for (const iface of interfaces) {
    iface.file = 'esi-spec.generated.ts';
  }
  return interfaces;
}

interface TypeDriftResult {
  matches: { handwritten: string; generated: string; file: string }[];
  missingFields: {
    iface: string;
    field: string;
    specType: string;
    file: string;
  }[];
  extraFields: { iface: string; field: string; file: string }[];
  optionalityDrifts: {
    iface: string;
    field: string;
    handwrittenOptional: boolean;
    specOptional: boolean;
    file: string;
  }[];
}

function normalizeTypeName(name: string): string {
  return name.toLowerCase().replace(/[_-]/g, '');
}

function detectTypeDrift(
  handwritten: ParsedInterface[],
  generated: ParsedInterface[],
): TypeDriftResult {
  const result: TypeDriftResult = {
    matches: [],
    missingFields: [],
    extraFields: [],
    optionalityDrifts: [],
  };

  const generatedByNormalized = new Map<string, ParsedInterface>();
  for (const g of generated) {
    generatedByNormalized.set(normalizeTypeName(g.name), g);
  }

  for (const hw of handwritten) {
    const hwNorm = normalizeTypeName(hw.name);
    let bestMatch: ParsedInterface | undefined;
    let bestScore = 0;

    for (const [gNorm, g] of generatedByNormalized) {
      if (gNorm.includes(hwNorm) || hwNorm.includes(gNorm)) {
        const score = Math.min(hwNorm.length, gNorm.length);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = g;
        }
      }
    }

    if (!bestMatch) {
      const hwFieldNames = new Set(hw.fields.map((f) => f.name));
      for (const g of generated) {
        const gFieldNames = new Set(g.fields.map((f) => f.name));
        const overlap = [...hwFieldNames].filter((f) => gFieldNames.has(f));
        if (
          overlap.length >= 3 &&
          overlap.length / Math.max(hwFieldNames.size, gFieldNames.size) > 0.5
        ) {
          if (overlap.length > bestScore) {
            bestScore = overlap.length;
            bestMatch = g;
          }
        }
      }
    }

    if (!bestMatch) continue;

    result.matches.push({
      handwritten: hw.name,
      generated: bestMatch.name,
      file: hw.file,
    });

    const specFieldMap = new Map(bestMatch.fields.map((f) => [f.name, f]));
    const hwFieldMap = new Map(hw.fields.map((f) => [f.name, f]));

    for (const [fieldName, specField] of specFieldMap) {
      if (!hwFieldMap.has(fieldName)) {
        result.missingFields.push({
          iface: hw.name,
          field: fieldName,
          specType: specField.type,
          file: hw.file,
        });
      }
    }

    for (const [fieldName] of hwFieldMap) {
      if (!specFieldMap.has(fieldName)) {
        result.extraFields.push({
          iface: hw.name,
          field: fieldName,
          file: hw.file,
        });
      }
    }

    for (const [fieldName, hwField] of hwFieldMap) {
      const specField = specFieldMap.get(fieldName);
      if (specField && hwField.optional !== specField.optional) {
        result.optionalityDrifts.push({
          iface: hw.name,
          field: fieldName,
          handwrittenOptional: hwField.optional,
          specOptional: specField.optional,
          file: hw.file,
        });
      }
    }
  }

  return result;
}

function printTypeDriftReport(drift: TypeDriftResult): void {
  console.log('\n========================================');
  console.log('  Type Drift Report');
  console.log('========================================\n');

  console.log(`Matched interfaces: ${drift.matches.length}`);

  if (drift.missingFields.length > 0) {
    console.log(
      `\n--- MISSING FIELDS (in spec but not in hand-written types) ---`,
    );
    for (const m of drift.missingFields) {
      console.log(
        `  ${m.iface} (${m.file}): missing '${m.field}' (${m.specType})`,
      );
    }
  }

  if (drift.extraFields.length > 0) {
    console.log(
      `\n--- EXTRA FIELDS (in hand-written types but not in spec) ---`,
    );
    for (const e of drift.extraFields) {
      console.log(`  ${e.iface} (${e.file}): extra '${e.field}'`);
    }
  }

  if (drift.optionalityDrifts.length > 0) {
    console.log(`\n--- OPTIONALITY MISMATCHES ---`);
    for (const o of drift.optionalityDrifts) {
      const hw = o.handwrittenOptional ? 'optional' : 'required';
      const spec = o.specOptional ? 'optional' : 'required';
      console.log(
        `  ${o.iface} (${o.file}): '${o.field}' is ${hw} but spec says ${spec}`,
      );
    }
  }

  if (
    drift.missingFields.length === 0 &&
    drift.extraFields.length === 0 &&
    drift.optionalityDrifts.length === 0
  ) {
    console.log('\nNo type drift detected.');
  }

  console.log('\n========================================\n');
}

async function main(): Promise<void> {
  console.log(`Fetching ESI OpenAPI spec from ${ESI_OPENAPI_URL}...`);

  let spec: OpenApiSpec;
  try {
    const response = await fetch(ESI_OPENAPI_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    spec = (await response.json()) as OpenApiSpec;
  } catch (err) {
    console.error(`Failed to fetch ESI OpenAPI spec: ${err}`);
    console.error('Check your network connection and try again.');
    process.exit(1);
  }

  console.log('Parsing codebase endpoint definitions...');
  const codebaseEntries = parseEndpointFiles();
  const specEntries = parseOpenApiPaths(spec);

  console.log(`Found ${codebaseEntries.length} endpoints in codebase`);
  console.log(`Found ${specEntries.length} endpoints in ESI spec`);

  const result = validate(codebaseEntries, specEntries);
  printReport(result, codebaseEntries.length, specEntries.length);

  // Type drift detection
  console.log('Checking type drift...');
  const handwrittenTypes = parseHandwrittenTypes();
  const generatedTypes = parseGeneratedTypes();

  if (generatedTypes.length === 0) {
    console.log(
      'No generated types found — run "npm run generate:types" first.',
    );
  } else {
    console.log(
      `Found ${handwrittenTypes.length} hand-written interfaces, ${generatedTypes.length} generated interfaces`,
    );
    const drift = detectTypeDrift(handwrittenTypes, generatedTypes);
    printTypeDriftReport(drift);
  }

  const exitCode = result.methodMismatches.length > 0 ? 1 : 0;
  process.exit(exitCode);
}

main();
