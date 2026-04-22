/**
 * ESI Endpoint Validation Script
 *
 * Fetches the canonical ESI swagger spec and compares it against
 * the endpoint definitions in this codebase. Reports mismatches,
 * missing coverage, and deprecated endpoints.
 *
 * Usage: npx ts-node scripts/validate-esi-endpoints.ts
 *        npm run validate:esi
 */

import * as fs from 'fs';
import * as path from 'path';

const ESI_SWAGGER_URL = 'https://esi.evetech.net/latest/swagger.json';
const ENDPOINTS_DIR = path.resolve(__dirname, '../src/core/endpoints');

interface SwaggerSpec {
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
  const files = fs.readdirSync(ENDPOINTS_DIR).filter((f) => f.endsWith('Endpoints.ts'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(ENDPOINTS_DIR, file), 'utf-8');

    const pathRegex = /(\w+):\s*\{[^}]*?path:\s*'([^']+)'[^}]*?method:\s*'(GET|POST|PUT|DELETE)'/gs;
    let match;

    while ((match = pathRegex.exec(content)) !== null) {
      entries.push({
        name: match[1],
        path: match[2],
        method: match[3],
        file,
      });
    }
  }

  return entries;
}

function parseSwaggerPaths(
  spec: SwaggerSpec
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
  specEntries: { method: string; path: string; tags: string[] }[]
): ValidationResult {
  const result: ValidationResult = {
    inCodebaseOnly: [],
    inSpecOnly: [],
    methodMismatches: [],
    matched: 0,
  };

  const specMap = new Map<string, { method: string; path: string; tags: string[] }[]>();
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

    const methodMatch = specMatches.find(
      (s) => s.method === entry.method
    );

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

function printReport(result: ValidationResult, codebaseCount: number, specCount: number): void {
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
    console.log('  (May be newer endpoints not yet in public spec, or removed endpoints)');
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

async function main(): Promise<void> {
  console.log(`Fetching ESI swagger spec from ${ESI_SWAGGER_URL}...`);

  let spec: SwaggerSpec;
  try {
    const response = await fetch(ESI_SWAGGER_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    spec = (await response.json()) as SwaggerSpec;
  } catch (err) {
    console.error(`Failed to fetch ESI swagger spec: ${err}`);
    console.error('Check your network connection and try again.');
    process.exit(1);
  }

  console.log('Parsing codebase endpoint definitions...');
  const codebaseEntries = parseEndpointFiles();
  const specEntries = parseSwaggerPaths(spec);

  console.log(`Found ${codebaseEntries.length} endpoints in codebase`);
  console.log(`Found ${specEntries.length} endpoints in ESI spec`);

  const result = validate(codebaseEntries, specEntries);
  printReport(result, codebaseEntries.length, specEntries.length);

  const exitCode = result.methodMismatches.length > 0 ? 1 : 0;
  process.exit(exitCode);
}

main();
