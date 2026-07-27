/**
 * ESI Client Wrapper Generator
 *
 * Reads endpoint definition files and generates typed client classes
 * that extend BaseEsiClient. Generated clients supplement hand-written
 * ones — hand-written clients take precedence in ClientRegistry.
 *
 * Usage: npx ts-node scripts/generate-clients.ts
 *        npm run generate:clients
 */

import * as fs from 'fs';
import * as path from 'path';

const ENDPOINTS_DIR = path.resolve(__dirname, '../src/core/endpoints');
const OUTPUT_DIR = path.resolve(__dirname, '../src/clients/generated');

interface ParsedEndpoint {
  name: string;
  method: string;
  requiresAuth: boolean;
  pathParams: string[];
  queryParams: Record<string, string>;
  hasBody: boolean;
  hasBodyBuilder: boolean;
  schemaRef: string | null;
  isArraySchema: boolean;
}

interface ParsedEndpointFile {
  fileName: string;
  exportName: string;
  schemaImports: Map<string, string>;
  endpoints: ParsedEndpoint[];
}

function extractTopLevelEntries(
  content: string,
  outerBracePos: number,
): { name: string; body: string }[] {
  const entries: { name: string; body: string }[] = [];
  let depth = 0;
  let i = outerBracePos;

  depth = 1;
  i++;

  while (i < content.length && depth > 0) {
    if (depth === 1) {
      const entryMatch = content.slice(i).match(/^\s*(\w+)\s*:\s*\{/);
      if (entryMatch) {
        const name = entryMatch[1]!;
        const bodyStart = i + entryMatch[0].length;
        let entryDepth = 1;
        let j = bodyStart;
        while (j < content.length && entryDepth > 0) {
          if (content[j] === '{' || content[j] === '(') entryDepth++;
          else if (content[j] === '}' || content[j] === ')') entryDepth--;
          if (entryDepth > 0) j++;
        }
        entries.push({ name, body: content.slice(bodyStart, j) });
        i = j + 1;
        continue;
      }
    }
    if (content[i] === '{') depth++;
    else if (content[i] === '}') depth--;
    i++;
  }

  return entries;
}

function parseEndpointFile(filePath: string): ParsedEndpointFile | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath, '.ts');

  const exportMatch = content.match(
    /export\s+const\s+(\w+Endpoints)\s*=/,
  );
  if (!exportMatch) return null;

  const exportName = exportMatch[1]!;

  const schemaImports = new Map<string, string>();
  const importRegex =
    /import\s+\{([^}]+)\}\s+from\s+'([^']+schemas[^']*)'/g;
  let importMatch;
  while ((importMatch = importRegex.exec(content)) !== null) {
    const names = importMatch[1]!.split(',').map((s) => s.trim());
    const importPath = importMatch[2]!;
    for (const name of names) {
      if (name) schemaImports.set(name, importPath);
    }
  }

  const endpoints: ParsedEndpoint[] = [];

  const objStart = content.indexOf('{', content.indexOf(exportName));
  if (objStart === -1) return null;

  const topLevelEntries = extractTopLevelEntries(content, objStart);

  for (const { name, body } of topLevelEntries) {
    const methodMatch = body.match(/method:\s*'(\w+)'/);
    if (!methodMatch) continue;

    const authMatch = body.match(/requiresAuth:\s*(true|false)/);
    const pathParamsMatch = body.match(/pathParams:\s*\[([^\]]*)\]/);
    const queryParamsMatch = body.match(/queryParams:\s*\{([^}]*)\}/);
    const hasBody = /hasBody:\s*true/.test(body);
    const hasBodyBuilder = /bodyBuilder:/.test(body);

    const pathParams = pathParamsMatch
      ? pathParamsMatch[1]!
          .split(',')
          .map((s) => s.trim().replace(/'/g, ''))
          .filter(Boolean)
      : [];

    const queryParams: Record<string, string> = {};
    if (queryParamsMatch) {
      const qpContent = queryParamsMatch[1]!;
      const qpRegex = /(\w+):\s*'([^']+)'/g;
      let qpMatch;
      while ((qpMatch = qpRegex.exec(qpContent)) !== null) {
        queryParams[qpMatch[1]!] = qpMatch[2]!;
      }
    }

    let schemaRef: string | null = null;
    let isArraySchema = false;

    const schemaMatch = body.match(
      /responseSchema:\s*(?:z\.array\()?(\w+Schema)(?:\))?/,
    );
    if (schemaMatch) {
      schemaRef = schemaMatch[1]!;
      isArraySchema = body.includes(`z.array(${schemaRef})`);
    } else if (body.match(/responseSchema:\s*z\.array\(z\.\w+/)) {
      const primitiveMatch = body.match(
        /responseSchema:\s*z\.array\(z\.(\w+)\(\)\)/,
      );
      if (primitiveMatch) {
        schemaRef = `__primitive_array_${primitiveMatch[1]}`;
        isArraySchema = true;
      }
    }

    endpoints.push({
      name,
      method: methodMatch[1]!,
      requiresAuth: authMatch?.[1] === 'true',
      pathParams,
      queryParams,
      hasBody,
      hasBodyBuilder,
      schemaRef,
      isArraySchema,
    });
  }

  if (endpoints.length === 0) return null;

  return { fileName, exportName, schemaImports, endpoints };
}

function inferReturnType(ep: ParsedEndpoint): string {
  if (!ep.schemaRef) return 'unknown';

  if (ep.schemaRef.startsWith('__primitive_array_')) {
    const primitive = ep.schemaRef.replace('__primitive_array_', '');
    const tsType = primitive === 'number' ? 'number' : primitive === 'string' ? 'string' : 'unknown';
    return `${tsType}[]`;
  }

  const baseType = `z.infer<typeof ${ep.schemaRef}>`;
  return ep.isArraySchema ? `(${baseType})[]` : baseType;
}

function generateMethodParams(ep: ParsedEndpoint): string {
  const params: string[] = [];

  for (const p of ep.pathParams) {
    params.push(`${p}: number | string`);
  }

  for (const [paramName] of Object.entries(ep.queryParams)) {
    params.push(`${paramName}: string | number`);
  }

  if (ep.hasBody) {
    params.push('body: unknown');
  } else if (ep.hasBodyBuilder) {
    params.push('body: unknown');
  }

  return params.join(', ');
}

function generateMethodArgs(ep: ParsedEndpoint): string {
  const args: string[] = [];

  for (const p of ep.pathParams) {
    args.push(p);
  }

  for (const [paramName] of Object.entries(ep.queryParams)) {
    args.push(paramName);
  }

  if (ep.hasBody || ep.hasBodyBuilder) {
    args.push('body');
  }

  return args.join(', ');
}

function toClassName(endpointFileName: string): string {
  const base = endpointFileName
    .replace(/Endpoints$/, '')
    .replace(/^./, (c) => c.toUpperCase());

  return `${base}Client`;
}

function generateClient(parsed: ParsedEndpointFile): string {
  const className = toClassName(parsed.exportName.replace(/Endpoints$/, ''));
  const genClassName = `Generated${className}`;

  const schemaImportList = new Set<string>();
  for (const ep of parsed.endpoints) {
    if (ep.schemaRef && !ep.schemaRef.startsWith('__primitive_array_')) {
      schemaImportList.add(ep.schemaRef);
    }
  }

  const lines: string[] = [
    '/* eslint-disable */',
    '// Auto-generated client wrapper — do not edit manually',
    '// Hand-written clients in src/clients/ take precedence',
    '',
    "import { z } from 'zod';",
    `import { ApiClient } from '../../core/ApiClient';`,
    `import { BaseEsiClient } from '../BaseEsiClient';`,
    `import { ${parsed.exportName} } from '../../core/endpoints/${parsed.fileName}';`,
  ];

  if (schemaImportList.size > 0) {
    const schemasByPath = new Map<string, string[]>();
    for (const name of schemaImportList) {
      const importPath = parsed.schemaImports.get(name);
      if (importPath) {
        const relativePath = importPath.replace(/^\.\.\/\.\.\//, '../../');
        const group = schemasByPath.get(relativePath) ?? [];
        group.push(name);
        schemasByPath.set(relativePath, group);
      }
    }

    for (const [importPath, names] of schemasByPath) {
      lines.push(
        `import { ${names.sort().join(', ')} } from '${importPath}';`,
      );
    }
  }

  lines.push('');
  lines.push(
    `export class ${genClassName} extends BaseEsiClient<typeof ${parsed.exportName}> {`,
  );
  lines.push(`  constructor(client: ApiClient) {`);
  lines.push(`    super(client, ${parsed.exportName});`);
  lines.push(`  }`);

  for (const ep of parsed.endpoints) {
    const returnType = inferReturnType(ep);
    const params = generateMethodParams(ep);
    const args = generateMethodArgs(ep);
    const authTag = ep.requiresAuth ? '\n   * @requires Authentication' : '';

    lines.push('');
    lines.push(`  /**`);
    lines.push(
      `   * ${ep.method} ${ep.name}${authTag}`,
    );
    lines.push(`   */`);
    lines.push(
      `  ${ep.name}(${params}): Promise<${returnType}> {`,
    );
    if (ep.hasBody || ep.hasBodyBuilder) {
      lines.push(
        `    return (this.api.${ep.name} as any)(${args}) as Promise<${returnType}>;`,
      );
    } else {
      lines.push(
        `    return this.api.${ep.name}(${args}) as Promise<${returnType}>;`,
      );
    }
    lines.push(`  }`);
  }

  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

function main(): void {
  const endpointFiles = fs
    .readdirSync(ENDPOINTS_DIR)
    .filter(
      (f) =>
        f.endsWith('Endpoints.ts') &&
        !f.includes('.generated.') &&
        !f.startsWith('Endpoint'),
    );

  console.log(`Found ${endpointFiles.length} endpoint definition files`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const indexExports: string[] = [];
  let totalMethods = 0;

  for (const file of endpointFiles.sort()) {
    const filePath = path.join(ENDPOINTS_DIR, file);
    const parsed = parseEndpointFile(filePath);

    if (!parsed) {
      console.log(`  Skipped ${file} (no parseable endpoints)`);
      continue;
    }

    const clientCode = generateClient(parsed);
    const outputFileName = `${parsed.fileName.replace(/Endpoints$/, '')}.generated.ts`;
    const outputPath = path.join(OUTPUT_DIR, outputFileName);

    fs.writeFileSync(outputPath, clientCode, 'utf-8');
    totalMethods += parsed.endpoints.length;

    const className = `Generated${toClassName(parsed.exportName.replace(/Endpoints$/, ''))}`;
    indexExports.push(
      `export { ${className} } from './${outputFileName.replace('.ts', '')}';`,
    );

    console.log(
      `  ${file} → ${outputFileName} (${parsed.endpoints.length} methods)`,
    );
  }

  const indexLines = [
    '/* eslint-disable */',
    '// Auto-generated barrel — do not edit manually',
    '',
    ...indexExports.sort(),
    '',
  ];

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'index.ts'),
    indexLines.join('\n'),
    'utf-8',
  );

  console.log(
    `\nGenerated ${indexExports.length} client wrappers with ${totalMethods} total methods`,
  );
  console.log(`Output: ${OUTPUT_DIR}`);
}

main();
