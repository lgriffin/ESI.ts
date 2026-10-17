/**
 * Operation emitter (Phase 1 of the Road to Done plan): turns every operation
 * in the vendored ESI OpenAPI document into a typed function over one
 * `OperationTransport`, plus a `*Meta` constant carrying the operation's
 * method, path, SSO scopes and pagination style.
 *
 * Pure: takes the parsed document, returns source text. The CLI wrapper
 * (scripts/spec/spec-generate.ts) reads the file, formats with Prettier, and writes
 * or checks `src/generated/operations.generated.ts`. Promoted from the Phase 0
 * spike in docs/spikes/generator/.
 */

/** The vendored OpenAPI document the generator reads. */
export const SPEC_PATH = 'tests/contract/snapshots/esi-openapi.snapshot.json';
/** The module it writes. */
export const OUT_PATH = 'src/generated/operations.generated.ts';
/** What the generator adds to the document: see `OperationOverlay`. */
export const OVERLAY_PATH = 'scripts/spec/operation-overlay.json';

import { deprecatedTag, scopeTreeSource } from './spec-scope-tree';

// OpenAPI documents are untyped JSON.
type Schema = Record<string, any>;

export interface OpenApiDocument {
  readonly info?: { readonly version?: string };
  readonly paths: Record<string, Schema>;
  readonly components?: {
    readonly schemas?: Record<string, Schema>;
    readonly parameters?: Record<string, Schema>;
  };
}

export type Pagination = 'none' | 'page' | 'cursor';

/** Migration guidance for an operation the spec deprecates. */
export interface Deprecation {
  readonly message?: string;
  readonly replacedBy?: string;
  readonly sunsetDate?: string;
}

/**
 * What the generator adds to the vendored document
 * (`scripts/spec/operation-overlay.json`):
 *
 * - `paths`: operations ESI serves but its spec does not list, such as the
 *   specification document itself under `meta/`, written as OpenAPI path
 *   items. A path the spec already lists is refused, so the overlay entry is
 *   dropped once ESI documents the route.
 * - `deprecations`: by operationId, the message, replacement and sunset date
 *   of an operation the spec marks deprecated. The spec carries only the
 *   flag; an entry for an operation that is missing or not deprecated is
 *   refused, so a stale entry cannot linger.
 */
export interface OperationOverlay {
  readonly paths?: Record<string, Schema>;
  readonly deprecations?: Readonly<Record<string, Deprecation>>;
}

export interface GeneratedOperation {
  readonly operationId: string;
  readonly functionName: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  readonly path: string;
  readonly scopes: readonly string[];
  readonly pagination: Pagination;
  readonly deprecated: boolean;
  /** The overlay's guidance for a deprecated operation; `{}` when it has none. */
  readonly deprecation?: Deprecation;
  /** Accept header for an operation whose success body is not JSON. */
  readonly textResponse?: { readonly accept: string };
  /** The spec pairs the JSON 200 with a 204: no content reads as `[]`. */
  readonly emptyWhenNoContent?: boolean;
  readonly headers: readonly string[];
  /** The spec summary, for the scope tree's JSDoc. */
  readonly summary?: string;
  /** Path parameters in the order the template names them, with their types. */
  readonly pathParams: readonly {
    readonly name: string;
    readonly type: string;
  }[];
  /**
   * What the function takes after the path parameters: nothing, only
   * optional query parameters, or at least one required one.
   */
  readonly query: 'none' | 'optional' | 'required';
  /** The `*Params` interface, when the function takes params. */
  readonly paramsType?: string;
  readonly body?: { readonly type: string; readonly optional: boolean };
}

export interface GenerateResult {
  /** Unformatted TypeScript source for the generated module. */
  readonly source: string;
  readonly operations: readonly GeneratedOperation[];
  /** Named types emitted: referenced component schemas plus per-operation ones. */
  readonly typeCount: number;
}

export interface GenerateOptions {
  /** Repository-relative path of the document, recorded in the header. */
  readonly specPath: string;
  /** Module specifier the generated file imports the transport port from. */
  readonly transportImport: string;
  /** Operations and deprecation guidance to add to the document. */
  readonly overlay?: OperationOverlay;
}

export class SpecGenerateError extends Error {
  override readonly name = 'SpecGenerateError';
}

const METHODS = ['get', 'post', 'put', 'delete'] as const;
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/**
 * The document with the overlay's paths added. Refuses a path the document
 * already lists: the overlay is for routes the spec leaves out.
 */
export function mergeOverlay(
  doc: OpenApiDocument,
  overlay: OperationOverlay | undefined,
): OpenApiDocument {
  const extra = overlay?.paths ?? {};
  for (const path of Object.keys(extra)) {
    if (path in doc.paths) {
      throw new SpecGenerateError(
        `overlay path ${path} is now in the spec: remove it from the overlay`,
      );
    }
  }
  return { ...doc, paths: { ...doc.paths, ...extra } };
}

/**
 * The overlay paths that `exceptions` (the `METHOD path` keys of
 * scripts/spec/esi-endpoint-exceptions.json) does not list, as
 * `METHOD path` strings. Every operation the overlay adds is one the spec
 * leaves out, so endpoint validation has to know it too.
 */
export function overlayRoutesMissingFrom(
  overlay: OperationOverlay,
  exceptions: ReadonlySet<string>,
): string[] {
  const missing: string[] = [];
  for (const [path, item] of Object.entries(overlay.paths ?? {})) {
    for (const method of METHODS) {
      if (!item[method]) continue;
      const key = `${method.toUpperCase()} ${path.replace(/^\//, '')}`;
      if (!exceptions.has(key)) missing.push(key);
    }
  }
  return missing;
}

/** Content types read as text: anything not JSON that a string describes. */
const isTextContent = (type: string, media: Schema | undefined): boolean =>
  !/json/i.test(type) &&
  (media?.schema as Schema | undefined)?.type === 'string';

/** `GetCharactersCharacterIdWallet` becomes `getCharactersCharacterIdWallet`. */
export function functionNameFor(operationId: string): string {
  const name = operationId.charAt(0).toLowerCase() + operationId.slice(1);
  if (!IDENTIFIER.test(name)) {
    throw new SpecGenerateError(
      `operationId "${operationId}" is not a valid identifier`,
    );
  }
  return name;
}

const quoteKey = (key: string): string =>
  IDENTIFIER.test(key) ? key : JSON.stringify(key);

/** A JSDoc block; `*\/` in spec text would end the comment early. */
function jsdoc(lines: readonly (string | undefined)[]): string {
  const body = lines
    .filter((l): l is string => l !== undefined)
    .flatMap((l) => l.replace(/\*\//g, '*\\/').trim().split(/\r?\n/));
  while (body[0] === '') body.shift();
  while (body.length > 0 && body[body.length - 1] === '') body.pop();
  if (body.length === 0) return '';
  if (body.length === 1) return `/** ${body[0]} */\n`;
  return `/**\n${body.map((l) => ` * ${l}`.trimEnd()).join('\n')}\n */\n`;
}

/** Parenthesise a union or intersection before it takes `[]` or joins another. */
const wrap = (t: string): string => (/[|&]/.test(t) ? `(${t})` : t);

export function generateOperations(
  source: OpenApiDocument,
  options: GenerateOptions,
): GenerateResult {
  const doc = mergeOverlay(source, options.overlay);
  const deprecations = options.overlay?.deprecations ?? {};
  const schemas = doc.components?.schemas ?? {};
  const sharedParams = doc.components?.parameters ?? {};
  const declared = new Map<string, string>();

  function refTarget(ref: string, kind: 'schemas' | 'parameters'): string {
    const prefix = `#/components/${kind}/`;
    if (!ref.startsWith(prefix)) {
      throw new SpecGenerateError(`unsupported $ref "${ref}"`);
    }
    return ref.slice(prefix.length);
  }

  function declare(name: string, text: string): void {
    if (declared.has(name) && declared.get(name) !== '') {
      throw new SpecGenerateError(`type name "${name}" is emitted twice`);
    }
    declared.set(name, text);
  }

  function useSchema(name: string): string {
    if (!declared.has(name)) {
      const schema = schemas[name];
      if (!schema) {
        throw new SpecGenerateError(`$ref to missing schema "${name}"`);
      }
      declared.set(name, ''); // reserve before recursing, for cycles
      // eslint-disable-next-line sonarjs/no-element-overwrite -- replaces the reservation above once the recursion returns
      declared.set(
        name,
        `${jsdoc([schema.description])}export type ${name} = ${inlineType(schema)};\n`,
      );
    }
    return name;
  }

  function objectType(s: Schema): string {
    const props = Object.entries<Schema>(s.properties ?? {});
    const extra = s.additionalProperties;
    if (props.length === 0) {
      const value =
        extra && extra !== true && Object.keys(extra).length > 0
          ? inlineType(extra)
          : 'unknown';
      return `Readonly<Record<string, ${value}>>`;
    }
    const required = new Set<string>(s.required ?? []);
    const lines = props.map(
      ([key, value]) =>
        `${jsdoc([value.description, value.deprecated ? '@deprecated' : undefined])}readonly ${quoteKey(key)}${required.has(key) ? '' : '?'}: ${inlineType(value)};`,
    );
    return `{\n${lines.join('\n')}\n}`;
  }

  function inlineType(s: Schema): string {
    if (s.$ref) return useSchema(refTarget(s.$ref, 'schemas'));
    if (Array.isArray(s.enum)) {
      return s.enum.map((v: unknown) => JSON.stringify(v)).join(' | ');
    }
    if ('const' in s) return JSON.stringify(s.const);
    const union = s.oneOf ?? s.anyOf;
    if (Array.isArray(union)) {
      return union.map((x: Schema) => wrap(inlineType(x))).join(' | ');
    }
    if (Array.isArray(s.allOf)) {
      return s.allOf.map((x: Schema) => wrap(inlineType(x))).join(' & ');
    }
    if (Array.isArray(s.type)) {
      return s.type
        .map((t: string) => wrap(inlineType({ ...s, type: t })))
        .join(' | ');
    }
    switch (s.type) {
      case 'integer':
      case 'number':
        return 'number';
      case 'string':
        return 'string';
      case 'boolean':
        return 'boolean';
      case 'null':
        return 'null';
      case 'array':
        return `readonly ${wrap(inlineType(s.items ?? {}))}[]`;
      case 'object':
        return objectType(s);
      default:
        return s.properties ? objectType(s) : 'unknown';
    }
  }

  /** A `$ref` keeps its component name; an inline schema gets `fallback`. */
  function namedType(s: Schema, fallback: string): string {
    if (s.$ref) return useSchema(refTarget(s.$ref, 'schemas'));
    declare(fallback, `export type ${fallback} = ${inlineType(s)};\n`);
    return fallback;
  }

  function resolveSchema(s: Schema): Schema {
    return s.$ref ? (schemas[refTarget(s.$ref, 'schemas')] ?? {}) : s;
  }

  const operations: GeneratedOperation[] = [];
  const functions: string[] = [];
  const seenIds = new Set<string>();

  for (const path of Object.keys(doc.paths).sort()) {
    const item = doc.paths[path]!;
    for (const method of METHODS) {
      const op = item[method];
      if (!op) continue;
      const operationId: string = op.operationId;
      if (!operationId) {
        throw new SpecGenerateError(
          `${method.toUpperCase()} ${path} has no operationId`,
        );
      }
      if (seenIds.has(operationId)) {
        throw new SpecGenerateError(`operationId "${operationId}" repeats`);
      }
      seenIds.add(operationId);
      const fn = functionNameFor(operationId);

      const allParams: Schema[] = [
        ...(item.parameters ?? []),
        ...(op.parameters ?? []),
      ].map((p: Schema) => {
        const resolved = p.$ref
          ? sharedParams[refTarget(p.$ref, 'parameters')]
          : p;
        if (!resolved) {
          throw new SpecGenerateError(`${operationId}: missing $ref`);
        }
        if (resolved.in === 'cookie') {
          throw new SpecGenerateError(`${operationId}: cookie parameter`);
        }
        return resolved;
      });
      // Header parameters (compatibility date, tenant, language, conditional
      // request headers) are client configuration the pipeline supplies, not
      // per-call arguments. The Meta names them so the transport can check it
      // sends every one the operation accepts.
      const headers = allParams
        .filter((p) => p.in === 'header')
        .map((p) => p.name as string);
      const params = allParams.filter((p) => p.in !== 'header');

      const queryNames = new Set(
        params.filter((p) => p.in === 'query').map((p) => p.name as string),
      );
      const pagination: Pagination = queryNames.has('page')
        ? 'page'
        : queryNames.has('before') || queryNames.has('after')
          ? 'cursor'
          : 'none';
      const pathParams = params.filter((p) => p.in === 'path');
      const queryParams = params.filter(
        (p) =>
          p.in === 'query' && !(pagination === 'page' && p.name === 'page'),
      );

      const scopes = [
        ...new Set<string>(
          (op.security ?? []).flatMap((s: Schema) => Object.values(s).flat()),
        ),
      ];
      const deprecated = op.deprecated === true;
      const guidance = deprecations[operationId];
      if (guidance && !deprecated) {
        throw new SpecGenerateError(
          `overlay deprecation for ${operationId}: the spec does not deprecate it`,
        );
      }
      const deprecation: Deprecation | undefined = deprecated
        ? (guidance ?? {})
        : undefined;
      const upper = method.toUpperCase() as GeneratedOperation['method'];

      // The success body sits under the first 2xx (POST contacts answers 201).
      const codes = Object.keys(op.responses ?? {}).filter((code) =>
        /^2\d\d$/.test(code),
      );
      const success = [...codes].sort()[0];
      const content = (
        success ? (op.responses[success]?.content ?? {}) : {}
      ) as Record<string, Schema>;
      // A body that is not JSON (the YAML specification) is read as text,
      // asked for with every type the response lists.
      const textTypes = content['application/json']
        ? []
        : Object.keys(content).filter((t) => isTextContent(t, content[t]));
      const textResponse =
        textTypes.length > 0 ? { accept: textTypes.join(', ') } : undefined;
      const responseSchema = (content['application/json']?.schema ??
        (textResponse ? content[textTypes[0]!]!.schema : undefined)) as
        Schema | undefined;
      // ESI answers "nothing left" (an expired public contract) with no
      // content where the same route otherwise sends a JSON list, which the
      // transport then reads as an empty one. An object body has no empty
      // value, so a 204 there stays `undefined`.
      const jsonSchema = content['application/json']?.schema as
        Schema | undefined;
      const emptyWhenNoContent =
        upper === 'GET' &&
        success === '200' &&
        codes.includes('204') &&
        jsonSchema !== undefined &&
        resolveSchema(jsonSchema).type === 'array';
      const response = responseSchema
        ? namedType(responseSchema, `${operationId}Response`)
        : 'void';

      let element = response;
      if (pagination === 'page') {
        if (!responseSchema || resolveSchema(responseSchema).type !== 'array') {
          throw new SpecGenerateError(
            `${operationId} is paginated by page but its response is not an array`,
          );
        }
        element = `${response}[number]`;
      }

      const bodySchema: Schema | undefined =
        op.requestBody?.content?.['application/json']?.schema;
      const body = bodySchema
        ? namedType(bodySchema, `${operationId}Body`)
        : undefined;
      const bodyOptional = bodySchema && op.requestBody.required !== true;

      const paramsName = `${operationId}Params`;
      const fields = [...pathParams, ...queryParams].map((p) => {
        const optional = p.in !== 'path' && p.required !== true;
        const description = p.description ?? p.schema?.description;
        return `${jsdoc([description])}readonly ${quoteKey(p.name)}${optional ? '?' : ''}: ${inlineType(p.schema ?? {})};`;
      });
      if (fields.length > 0) {
        declare(
          paramsName,
          `${jsdoc([`Parameters for \`${fn}\`.`])}export interface ${paramsName} {\n${fields.join('\n')}\n}\n`,
        );
      }
      const paramsRequired =
        pathParams.length > 0 || queryParams.some((p) => p.required === true);

      const signature = [
        'transport: OperationTransport',
        fields.length > 0
          ? paramsRequired
            ? `params: ${paramsName}`
            : `params: ${paramsName} = {}`
          : undefined,
        body ? `body${bodyOptional ? '?' : ''}: ${body}` : undefined,
      ].filter((x): x is string => x !== undefined);

      const pick = (list: Schema[]): string =>
        list
          .map(
            (p) =>
              `${quoteKey(p.name)}: ${IDENTIFIER.test(p.name) ? `params.${p.name}` : `params[${JSON.stringify(p.name)}]`}`,
          )
          .join(', ');
      const request = `{ path: { ${pick(pathParams)} }, query: { ${pick(queryParams)} }${body ? ', body' : ''} }`;
      const call =
        pagination === 'page'
          ? `transport.paginate<${element}>(${fn}Meta, ${request})`
          : `transport.request<${response}>(${fn}Meta, ${request})`;
      const returns =
        pagination === 'page'
          ? `AsyncIterable<${element}>`
          : `Promise<${response}>`;

      const route = `\`${upper} ${path}\``;
      const needs = scopes.length
        ? `Requires ${scopes.map((s) => `\`${s}\``).join(', ')}.`
        : 'Public.';
      const pages =
        pagination === 'page'
          ? 'Follows every page and yields one item at a time.'
          : pagination === 'cursor'
            ? 'Cursor-paginated: pass `before` or `after` from the previous response.'
            : undefined;

      functions.push(
        `export const ${fn}Meta: OperationMeta = {\n` +
          `  operationId: ${JSON.stringify(operationId)},\n` +
          `  method: '${upper}',\n` +
          `  path: ${JSON.stringify(path)},\n` +
          `  scopes: ${JSON.stringify(scopes)},\n` +
          `  pagination: '${pagination}',\n` +
          `  deprecated: ${deprecated},\n` +
          (deprecation
            ? `  deprecation: ${JSON.stringify(deprecation)},\n`
            : '') +
          (textResponse
            ? `  textResponse: ${JSON.stringify(textResponse)},\n`
            : '') +
          (emptyWhenNoContent ? `  emptyWhenNoContent: true,\n` : '') +
          `  headers: ${JSON.stringify(headers)},\n` +
          `};\n\n` +
          jsdoc([
            op.summary ?? operationId,
            '',
            `${route}. ${needs}${pages ? ` ${pages}` : ''}`,
            path in source.paths
              ? undefined
              : `ESI's spec does not list this route: it comes from ${OVERLAY_PATH}.`,
            deprecation ? deprecatedTag(deprecation) : undefined,
          ]) +
          `export function ${fn}(${signature.join(', ')}): ${returns} {\n` +
          `  return ${call};\n}\n`,
      );
      const templateOrder = [...path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
      operations.push({
        operationId,
        functionName: fn,
        method: upper,
        path,
        scopes,
        pagination,
        deprecated,
        deprecation,
        textResponse,
        emptyWhenNoContent: emptyWhenNoContent || undefined,
        headers,
        summary: op.summary,
        pathParams: templateOrder.map((name) => {
          const p = pathParams.find((x) => x.name === name);
          if (!p) {
            throw new SpecGenerateError(
              `${operationId}: path parameter {${name}} is not declared`,
            );
          }
          return { name, type: inlineType(p.schema ?? {}) };
        }),
        query:
          queryParams.length === 0
            ? 'none'
            : queryParams.some((p) => p.required === true)
              ? 'required'
              : 'optional',
        paramsType: fields.length > 0 ? paramsName : undefined,
        body: body
          ? { type: body, optional: bodyOptional === true }
          : undefined,
      });
    }
  }

  for (const id of Object.keys(deprecations)) {
    if (!seenIds.has(id)) {
      throw new SpecGenerateError(
        `overlay deprecation for ${id}: no such operation`,
      );
    }
  }

  const version = doc.info?.version;
  const additions = options.overlay
    ? `, with the additions in ${OVERLAY_PATH}`
    : '';
  const header =
    `/* eslint-disable */\n` +
    `// Generated by scripts/spec/spec-generate.ts from ${options.specPath}` +
    `${version ? ` (ESI ${version})` : ''}` +
    `${additions}. Do not edit.\n` +
    `// Regenerate with \`npm run spec:generate\`; CI runs \`npm run spec:generate:check\`.\n\n` +
    `import type {\n  OperationMeta,\n  OperationTransport,\n} from '${options.transportImport}';\n\n`;

  const types = [...declared.keys()].sort().map((name) => declared.get(name)!);

  return {
    source: `${header}${types.join('\n')}\n${functions.join('\n')}\n${scopeTreeSource(operations)}`,
    operations,
    typeCount: declared.size,
  };
}
