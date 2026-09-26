/**
 * Generator spike (Phase 0 of the Road to Done plan): an in-repo emitter that
 * turns selected spec operations into typed functions over one Transport.
 * Run: npx ts-node --transpile-only docs/spikes/generator/emit.ts
 */
import * as fs from 'fs';
import * as path from 'path';

type Schema = Record<string, any>;
const SPEC = 'tests/contract/snapshots/esi-openapi.snapshot.json';
const OUT = path.join(__dirname, 'operations.generated.ts');
const PICK: Array<[string, string]> = [
  ['get', '/status'],
  ['get', '/markets/{region_id}/orders'],
  ['get', '/characters/{character_id}/wallet'],
  ['get', '/universe/types/{type_id}'],
  ['post', '/universe/names'],
];

const spec = JSON.parse(fs.readFileSync(SPEC, 'utf8'));
const emittedTypes = new Map<string, string>();

const camel = (id: string) => id.charAt(0).toLowerCase() + id.slice(1);
const quoteKey = (k: string) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`);
const doc = (text: string | undefined, indent = '') =>
  text
    ? `${indent}/** ${text.replace(/\*\//g, '* /').replace(/\n+/g, ' ')} */\n`
    : '';

function tsType(s: Schema, nameHint: string): string {
  if (s.$ref) {
    const name = s.$ref.split('/').pop()!;
    if (!emittedTypes.has(name)) {
      emittedTypes.set(name, ''); // reserve before recursing (cycles)
      emittedTypes.set(name, declare(name, spec.components.schemas[name]));
    }
    return name;
  }
  if (s.enum) return s.enum.map((v: unknown) => JSON.stringify(v)).join(' | ');
  switch (s.type) {
    case 'integer':
    case 'number':
      return 'number';
    case 'string':
      return 'string';
    case 'boolean':
      return 'boolean';
    case 'array':
      return `readonly ${wrap(tsType(s.items ?? {}, nameHint + 'Item'))}[]`;
    case 'object':
      return objectType(s, nameHint, '');
    default:
      return 'unknown';
  }
}
const wrap = (t: string) => (t.includes('|') || t.includes('{') ? `(${t})` : t);

function objectType(s: Schema, nameHint: string, indent: string): string {
  const props = s.properties ?? {};
  const req = new Set<string>(s.required ?? []);
  const lines = Object.entries<Schema>(props).map(
    ([k, v]) =>
      `${doc(v.description, indent + '  ')}${indent}  readonly ${quoteKey(k)}${req.has(k) ? '' : '?'}: ${tsType(v, nameHint + k)};`,
  );
  return lines.length
    ? `{\n${lines.join('\n')}\n${indent}}`
    : 'Record<string, unknown>';
}

function declare(name: string, s: Schema): string {
  const body =
    s.type === 'object' || s.properties
      ? objectType(s, name, '')
      : tsType(s, name);
  return `${doc(s.description)}export type ${name} = ${body};\n`;
}

const fns: string[] = [];
for (const [method, p] of PICK) {
  const op = spec.paths[p][method];
  const params = [
    ...(spec.paths[p].parameters ?? []),
    ...(op.parameters ?? []),
  ].filter(
    (x: Schema) => !x.$ref, // shared header params (compat date, tenant, etag) belong to the pipeline
  );
  const pathParams = params.filter((x: Schema) => x.in === 'path');
  const queryParams = params.filter(
    (x: Schema) => x.in === 'query' && x.name !== 'page',
  );
  const paginated = params.some(
    (x: Schema) => x.in === 'query' && x.name === 'page',
  );
  const scopes: string[] = (op.security ?? []).flatMap((s: Schema) =>
    Object.values(s).flat(),
  );
  const respSchema =
    op.responses?.['200']?.content?.['application/json']?.schema;
  const bodySchema = op.requestBody?.content?.['application/json']?.schema;
  const fn = camel(op.operationId);
  const resp = respSchema
    ? tsType(respSchema, op.operationId + 'Response')
    : 'void';
  // A paginated response is an array; the iterator yields its elements.
  const item = paginated ? `${resp}[number]` : resp;
  const paramsType = [...pathParams, ...queryParams]
    .map(
      (x: Schema) =>
        `${doc(x.schema?.description ?? x.description, '  ')}  readonly ${x.name}${x.required ? '' : '?'}: ${tsType(x.schema ?? {}, fn)};`,
    )
    .join('\n');
  const hasParams = paramsType.length > 0;
  const bodyArg = bodySchema
    ? `, body: ${tsType(bodySchema, op.operationId + 'Body')}`
    : '';
  const pathObj = pathParams
    .map((x: Schema) => `${x.name}: params.${x.name}`)
    .join(', ');
  const queryObj = queryParams
    .map((x: Schema) => `${x.name}: params.${x.name}`)
    .join(', ');
  const call = paginated
    ? `transport.paginate<${item}>`
    : `transport.request<${resp}>`;
  const ret = paginated ? `AsyncIterable<${item}>` : `Promise<${resp}>`;

  fns.push(
    `${hasParams ? `export interface ${op.operationId}Params {\n${paramsType}\n}\n\n` : ''}` +
      `export const ${fn}Meta: OperationMeta = {\n  operationId: '${op.operationId}',\n  method: '${method.toUpperCase()}',\n  path: '${p}',\n  scopes: ${JSON.stringify(scopes)},\n  paginated: ${paginated},\n};\n\n` +
      `/**\n * ${(op.summary ?? op.operationId).replace(/\*\//g, '* /')}\n *\n * \`${method.toUpperCase()} ${p}\`${scopes.length ? `, requires ${scopes.map((s) => `\`${s}\``).join(', ')}` : ''}${paginated ? '. Follows every page.' : ''}\n */\n` +
      `export function ${fn}(transport: Transport${hasParams ? `, params: ${op.operationId}Params` : ''}${bodyArg}): ${ret} {\n` +
      `  return ${call}(${fn}Meta, { path: {${pathObj ? ` ${pathObj} ` : ''}}, query: {${queryObj ? ` ${queryObj} ` : ''}}${bodySchema ? ', body' : ''} });\n}\n`,
  );
}

const header = `// Generated by docs/spikes/generator/emit.ts from ${SPEC}. Do not edit.\nimport type { OperationMeta, Transport } from './transport';\n\n`;
fs.writeFileSync(
  OUT,
  header + [...emittedTypes.values()].join('\n') + '\n' + fns.join('\n'),
);
console.log(
  `wrote ${OUT}: ${fns.length} operations, ${emittedTypes.size} types`,
);
