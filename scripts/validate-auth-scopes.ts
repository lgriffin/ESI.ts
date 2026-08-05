/**
 * Auth/Scope Cross-Validation Script
 *
 * Compares `requiresAuth` in hand-written *Endpoints.ts files against
 * the scope map in esi-scopes.generated.ts. Catches two classes of bug:
 *
 *   ERROR: requiresAuth=false but esiEndpointScopes has an entry
 *          (no Authorization header sent, ESI returns 401/403)
 *
 *   WARN:  requiresAuth=true but no esiEndpointScopes entry
 *          (auth sent, but scope map is incomplete for OAuth consent screens)
 *
 * Usage: npx ts-node scripts/validate-auth-scopes.ts
 *        npm run validate:auth-scopes
 */

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Inline camelToSnake (mirrors src/core/util/stringUtil.ts)
// We inline it to avoid importing from src/ which may pull in zod/pino deps
// that complicate standalone script execution.
// ---------------------------------------------------------------------------
function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EndpointEntry {
  /** Endpoint name (object key in the endpoints map) */
  name: string;
  /** Raw path as written in the source file */
  rawPath: string;
  /** Normalized scope-map key: METHOD:snake_case_path (no trailing slash) */
  key: string;
  /** HTTP method */
  method: string;
  /** Whether the endpoint declares requiresAuth */
  requiresAuth: boolean;
  /** Source file name */
  file: string;
}

interface Exception {
  key: string;
  reason: string;
}

// ---------------------------------------------------------------------------
// Path normalization
// ---------------------------------------------------------------------------

/**
 * Convert path param placeholders from camelCase to snake_case and strip
 * the trailing slash so the key matches esiEndpointScopes format.
 *
 * Example:
 *   'characters/{characterId}/orders/' -> 'characters/{character_id}/orders'
 */
function normalizePath(rawPath: string): string {
  // Convert camelCase param names inside {...} to snake_case
  const snaked = rawPath.replace(/\{([^}]+)\}/g, (_match, param: string) => {
    return `{${camelToSnake(param)}}`;
  });
  // Strip trailing slash
  return snaked.replace(/\/$/, '');
}

// ---------------------------------------------------------------------------
// Parse endpoint definitions via regex (same approach as validate-esi-endpoints.ts)
// ---------------------------------------------------------------------------

const ENDPOINTS_DIR = path.resolve(__dirname, '../src/core/endpoints');
const EXCEPTIONS_FILE = path.resolve(__dirname, 'auth-scope-exceptions.json');

/** Files to skip when scanning the endpoints directory */
const SKIP_FILES = new Set([
  'EndpointDefinition.ts',
  'buildEndpointPath.ts',
  'createClient.ts',
]);

function isGeneratedFile(filename: string): boolean {
  return filename.startsWith('esi-') && filename.includes('.generated.');
}

function parseEndpointFiles(): EndpointEntry[] {
  const entries: EndpointEntry[] = [];
  const files = fs
    .readdirSync(ENDPOINTS_DIR)
    .filter(
      (f) =>
        f.endsWith('Endpoints.ts') &&
        !SKIP_FILES.has(f) &&
        !isGeneratedFile(f),
    );

  for (const file of files) {
    const content = fs.readFileSync(path.join(ENDPOINTS_DIR, file), 'utf-8');
    const lines = content.split('\n');

    // State machine: track brace depth to identify endpoint definition blocks.
    // Depth 0 = top-level (outside the exported object)
    // Depth 1 = inside the exported object (e.g. `export const xxxEndpoints = {`)
    // Depth 2 = inside an endpoint definition (e.g. `getCharacterOrders: {`)
    let depth = 0;
    let currentName: string | null = null;
    let currentPath: string | null = null;
    let currentMethod: string | null = null;
    let currentAuth: boolean | null = null;

    for (const line of lines) {
      // Count braces outside of string literals. We strip quoted strings
      // first so that braces inside path templates (e.g. '{characterId}')
      // are not counted.
      const stripped = line.replace(/'[^']*'/g, '').replace(/"[^"]*"/g, '');

      // Detect endpoint name at depth 1 (a key followed by opening brace)
      if (depth === 1) {
        const nameMatch = line.match(/^\s+(\w+):\s*\{/);
        if (nameMatch) {
          currentName = nameMatch[1]!;
          currentPath = null;
          currentMethod = null;
          currentAuth = null;
        }
      }

      // Inside an endpoint block (depth >= 2), extract properties
      if (depth >= 2 && currentName) {
        const pathMatch = line.match(/path:\s*'([^']+)'/);
        if (pathMatch) currentPath = pathMatch[1]!;

        const methodMatch = line.match(
          /method:\s*'(GET|POST|PUT|DELETE)'/,
        );
        if (methodMatch) currentMethod = methodMatch[1]!;

        const authMatch = line.match(/requiresAuth:\s*(true|false)/);
        if (authMatch) currentAuth = authMatch[1] === 'true';
      }

      // Update depth based on braces (after extracting properties)
      for (const ch of stripped) {
        if (ch === '{') depth++;
        if (ch === '}') {
          depth--;
          // When we exit an endpoint block back to depth 1, emit the entry
          if (depth === 1 && currentName && currentPath && currentMethod && currentAuth !== null) {
            const normalized = normalizePath(currentPath);
            const key = `${currentMethod}:${normalized}`;
            entries.push({
              name: currentName,
              rawPath: currentPath,
              key,
              method: currentMethod,
              requiresAuth: currentAuth,
              file,
            });
            currentName = null;
            currentPath = null;
            currentMethod = null;
            currentAuth = null;
          }
        }
      }
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Parse the scope map
// ---------------------------------------------------------------------------

function parseScopeMapKeys(): Set<string> {
  const scopeFile = path.join(ENDPOINTS_DIR, 'esi-scopes.generated.ts');
  const content = fs.readFileSync(scopeFile, 'utf-8');

  const keys = new Set<string>();
  // Match keys like 'GET:characters/{character_id}/wallet'
  const keyRegex = /'([A-Z]+:[^']+)'/g;
  let match;
  while ((match = keyRegex.exec(content)) !== null) {
    keys.add(match[1]!);
  }

  return keys;
}

// ---------------------------------------------------------------------------
// Load exceptions
// ---------------------------------------------------------------------------

function loadExceptions(): Map<string, string> {
  const map = new Map<string, string>();
  if (!fs.existsSync(EXCEPTIONS_FILE)) return map;

  const raw = fs.readFileSync(EXCEPTIONS_FILE, 'utf-8');
  const entries: Exception[] = JSON.parse(raw);
  for (const e of entries) {
    map.set(e.key, e.reason);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

interface ValidationResult {
  errors: {
    entry: EndpointEntry;
    message: string;
  }[];
  warnings: {
    entry: EndpointEntry;
    message: string;
    excepted: boolean;
    exceptionReason?: string;
  }[];
  ok: number;
}

function validate(
  endpoints: EndpointEntry[],
  scopeKeys: Set<string>,
  exceptions: Map<string, string>,
): ValidationResult {
  const result: ValidationResult = { errors: [], warnings: [], ok: 0 };

  for (const entry of endpoints) {
    const hasScope = scopeKeys.has(entry.key);

    if (!entry.requiresAuth && hasScope) {
      // ERROR: endpoint says no auth needed, but ESI spec says it needs a scope
      result.errors.push({
        entry,
        message: `requiresAuth=false but esiEndpointScopes has scopes for ${entry.key}`,
      });
    } else if (entry.requiresAuth && !hasScope) {
      // WARN: endpoint says auth needed, but no scope entry exists
      const exceptionReason = exceptions.get(entry.key);
      result.warnings.push({
        entry,
        message: `requiresAuth=true but no esiEndpointScopes entry for ${entry.key}`,
        excepted: !!exceptionReason,
        exceptionReason,
      });
    } else {
      result.ok++;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function printReport(
  result: ValidationResult,
  totalEndpoints: number,
  totalScopeKeys: number,
): void {
  console.log('\n========================================');
  console.log('  Auth/Scope Cross-Validation Report');
  console.log('========================================\n');

  console.log(`Endpoint definitions scanned: ${totalEndpoints}`);
  console.log(`Scope map entries:            ${totalScopeKeys}`);
  console.log(`Aligned (OK):                 ${result.ok}`);
  console.log(`Errors:                       ${result.errors.length}`);
  console.log(
    `Warnings:                     ${result.warnings.length} (${result.warnings.filter((w) => w.excepted).length} excepted)`,
  );
  console.log('');

  if (result.errors.length > 0) {
    console.log('--- ERRORS (requiresAuth=false but scope exists) ---');
    console.log(
      '  These endpoints will fail at runtime: no Authorization header sent,',
    );
    console.log('  but ESI requires an OAuth scope.\n');
    for (const e of result.errors) {
      console.log(`  [ERROR] ${e.entry.name} in ${e.entry.file}`);
      console.log(`    Key:  ${e.entry.key}`);
      console.log(`    Path: ${e.entry.rawPath}`);
      console.log('');
    }
  }

  const activeWarnings = result.warnings.filter((w) => !w.excepted);
  const exceptedWarnings = result.warnings.filter((w) => w.excepted);

  if (activeWarnings.length > 0) {
    console.log(
      '--- WARNINGS (requiresAuth=true but no scope entry) ---',
    );
    console.log(
      '  These may be legitimate (some endpoints need auth without specific scopes).',
    );
    console.log(
      '  Add to auth-scope-exceptions.json if intentional.\n',
    );
    for (const w of activeWarnings) {
      console.log(`  [WARN] ${w.entry.name} in ${w.entry.file}`);
      console.log(`    Key:  ${w.entry.key}`);
      console.log(`    Path: ${w.entry.rawPath}`);
      console.log('');
    }
  }

  if (exceptedWarnings.length > 0) {
    console.log('--- EXCEPTED WARNINGS ---');
    for (const w of exceptedWarnings) {
      console.log(
        `  [OK] ${w.entry.key} -- ${w.exceptionReason}`,
      );
    }
    console.log('');
  }

  if (result.errors.length === 0 && activeWarnings.length === 0) {
    console.log('All endpoints pass auth/scope cross-validation.\n');
  }

  console.log('========================================\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  console.log('Scanning endpoint definitions...');
  const endpoints = parseEndpointFiles();
  console.log(`Found ${endpoints.length} endpoint definitions`);

  console.log('Parsing scope map...');
  const scopeKeys = parseScopeMapKeys();
  console.log(`Found ${scopeKeys.size} scope map entries`);

  console.log('Loading exceptions...');
  const exceptions = loadExceptions();
  console.log(`Loaded ${exceptions.size} exceptions`);

  const result = validate(endpoints, scopeKeys, exceptions);
  printReport(result, endpoints.length, scopeKeys.size);

  if (result.errors.length > 0) {
    process.exit(1);
  }

  process.exit(0);
}

main();
