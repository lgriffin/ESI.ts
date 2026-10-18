/**
 * Emits one Zod schema per operation's success body, keyed by operationId,
 * from the same vendored OpenAPI document as the generated operations, in two
 * modules:
 *
 * - src/schemas/generated/responseSchemas.generated.ts exports each schema
 *   under its operationId, where the custom endpoint maps can reach it
 *   (src/core may import src/schemas, not src/adapters). Every schema is a
 *   pure `z.lazy`, so a bundle keeps only the ones it imports (#673).
 * - src/adapters/responseSchemas.generated.ts holds the same schemas,
 *   built eagerly, in the `responseSchemas` map that `PipelineTransport`
 *   validates against when `validateResponse` is on, so the generated
 *   operations get the runtime check the hand-written clients have. It is a
 *   copy rather than a re-export because the lazy wrappers would cost the
 *   `./client` bundle about 8 kB.
 *
 * The schemas follow the spec's TypeScript types, with the same allowances as
 * the hand-written ones: objects are `z.looseObject` (ESI may add fields), and
 * a string enum accepts any string (ESI may add members; see
 * src/schemas/esiEnum.ts).
 */

import type { OpenApiDocument } from './spec-generate-core';
import { SpecGenerateError } from './spec-generate-core';

/** The map `createEsi` validates against. */
export const ZOD_OUT_PATH = 'src/adapters/responseSchemas.generated.ts';
/** The schemas themselves, one named export per operation. */
export const BASELINE_OUT_PATH =
  'src/schemas/generated/responseSchemas.generated.ts';

/** The parts of a JSON Schema object the emitter reads. */
interface Schema {
  readonly $ref?: string;
  readonly enum?: readonly unknown[];
  readonly const?: unknown;
  readonly oneOf?: readonly Schema[];
  readonly anyOf?: readonly Schema[];
  readonly allOf?: readonly Schema[];
  readonly type?: string | readonly string[];
  readonly items?: Schema;
  readonly properties?: Readonly<Record<string, Schema>>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean | Schema;
}

interface Operation {
  readonly operationId: string;
  readonly responses?: Readonly<
    Record<
      string,
      {
        readonly content?: Readonly<
          Record<string, { readonly schema?: Schema }>
        >;
      }
    >
  >;
}

const METHODS = ['get', 'post', 'put', 'delete'] as const;
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

const quoteKey = (key: string): string =>
  IDENTIFIER.test(key) ? key : JSON.stringify(key);

/** Wire deviations from the document, by component (response-schema-overrides.json). */
export type SchemaOverrides = Readonly<
  Record<string, { readonly nullable?: readonly string[] }>
>;

export interface ZodResult {
  /** Unformatted TypeScript source for the map module (ZOD_OUT_PATH). */
  readonly source: string;
  /** Unformatted TypeScript source for the schemas module (BASELINE_OUT_PATH). */
  readonly baselineSource: string;
  /** Operations with a JSON success body, and so a schema. */
  readonly operations: number;
  /** Component schemas emitted as named constants. */
  readonly components: number;
}

/** The export name of an operation's baseline schema: `GetStatus` is `GetStatusSchema`. */
export function baselineName(operationId: string): string {
  return `${operationId}Schema`;
}

export function generateResponseSchemas(
  doc: OpenApiDocument,
  specPath: string,
  overrides: SchemaOverrides = {},
): ZodResult {
  const schemas = (doc.components?.schemas ?? {}) as Readonly<
    Record<string, Schema>
  >;
  const emitted = new Map<string, string>();
  const inProgress = new Set<string>();
  const order: string[] = [];
  /** The components being emitted, innermost last, for the overrides. */
  const stack: string[] = [];

  for (const name of Object.keys(overrides)) {
    if (!schemas[name]) {
      throw new SpecGenerateError(`override names missing schema "${name}"`);
    }
  }
  /**
   * Only the innermost component: inline objects inside an overridden
   * component match, but a component it references does not, since that one
   * is emitted once and shared by every operation that reaches it.
   */
  const nullableHere = (key: string): boolean =>
    overrides[stack[stack.length - 1] ?? '']?.nullable?.includes(key) === true;

  const constName = (name: string): string =>
    `${name.replace(/[^\w$]/g, '_')}Schema`;

  function refTarget(ref: string): string {
    const prefix = '#/components/schemas/';
    if (!ref.startsWith(prefix)) {
      throw new SpecGenerateError(`unsupported $ref "${ref}"`);
    }
    return ref.slice(prefix.length);
  }

  function useComponent(name: string): string {
    if (inProgress.has(name)) return `z.lazy(() => ${constName(name)})`;
    if (!emitted.has(name)) {
      const schema = schemas[name];
      if (!schema) {
        throw new SpecGenerateError(`$ref to missing schema "${name}"`);
      }
      inProgress.add(name);
      stack.push(name);
      const body = zodOf(schema);
      stack.pop();
      inProgress.delete(name);
      emitted.set(name, body);
      order.push(name);
    }
    return constName(name);
  }

  function union(members: readonly string[]): string {
    const list = members.join(', ');
    return members.length === 1 ? members[0]! : `z.union([${list}])`;
  }

  function objectOf(s: Schema): string {
    const props = Object.entries(s.properties ?? {});
    const extra = s.additionalProperties;
    if (props.length === 0) {
      const value =
        typeof extra === 'object' && Object.keys(extra).length > 0
          ? zodOf(extra)
          : 'z.unknown()';
      return `z.record(z.string(), ${value})`;
    }
    const required = new Set<string>(s.required ?? []);
    const fields = props.map(([key, value]) => {
      const nullable = nullableHere(key) ? '.nullable()' : '';
      const optional = required.has(key) ? '' : '.optional()';
      return `${quoteKey(key)}: ${zodOf(value)}${nullable}${optional}`;
    });
    return `z.looseObject({ ${fields.join(', ')} })`;
  }

  function zodOf(s: Schema): string {
    if (s.$ref) return useComponent(refTarget(s.$ref));
    if (s.enum) {
      const kinds = new Set(s.enum.map((v: unknown) => typeof v));
      if (kinds.size === 1 && kinds.has('string')) return 'z.string()';
      if (kinds.size === 1 && kinds.has('number')) return 'z.number()';
      return union(
        s.enum.map((v: unknown) =>
          v === null ? 'z.null()' : `z.literal(${JSON.stringify(v)})`,
        ),
      );
    }
    if ('const' in s) {
      return s.const === null
        ? 'z.null()'
        : `z.literal(${JSON.stringify(s.const)})`;
    }
    const alternatives = s.oneOf ?? s.anyOf;
    if (alternatives) {
      return union(alternatives.map((x: Schema) => zodOf(x)));
    }
    if (s.allOf) {
      const [first, ...rest] = s.allOf.map((x: Schema) => zodOf(x));
      let joined: string = first ?? 'z.unknown()';
      for (const next of rest) joined = `z.intersection(${joined}, ${next})`;
      return joined;
    }
    if (typeof s.type === 'object') {
      return union(s.type.map((t: string) => zodOf({ ...s, type: t })));
    }
    switch (s.type) {
      case 'integer':
      case 'number':
        return 'z.number()';
      case 'string':
        return 'z.string()';
      case 'boolean':
        return 'z.boolean()';
      case 'null':
        return 'z.null()';
      case 'array':
        return `z.array(${zodOf(s.items ?? {})})`;
      case 'object':
        return objectOf(s);
      default:
        return s.properties ? objectOf(s) : 'z.unknown()';
    }
  }

  const entries: { id: string; body: string }[] = [];
  for (const path of Object.keys(doc.paths).sort()) {
    const item = doc.paths[path] as Partial<Record<string, Operation>>;
    for (const method of METHODS) {
      const op = item[method];
      if (!op) continue;
      const responses = op.responses ?? {};
      const success = Object.keys(responses)
        .filter((code) => /^2\d\d$/.test(code))
        .sort()[0];
      const schema = success
        ? responses[success]?.content?.['application/json']?.schema
        : undefined;
      if (!schema) continue;
      if (!IDENTIFIER.test(op.operationId)) {
        throw new SpecGenerateError(
          `operationId "${op.operationId}" is not an identifier`,
        );
      }
      entries.push({ id: op.operationId, body: zodOf(schema) });
    }
  }

  const version = doc.info?.version ? ` (ESI ${doc.info.version})` : '';
  const banner =
    `// Generated by scripts/spec/spec-generate.ts from ${specPath}` +
    `${version}. Do not edit.\n` +
    `// Regenerate with \`npm run spec:generate\`; CI runs \`npm run spec:generate:check\`.\n\n` +
    `import { z } from 'zod';\n\n`;
  const components = order
    .map(
      (name) => `const ${constName(name)}: z.ZodType = ${emitted.get(name)};\n`,
    )
    .join('');
  const mapRows = entries.map(({ id, body }) => `  ${id}: ${body},`);
  const source =
    `${banner}${components}` +
    `\n/** The success body of each operation that returns JSON, by operationId. */\n` +
    `export const responseSchemas: Readonly<Record<string, z.ZodType>> = {\n` +
    `${mapRows.join('\n')}\n};\n`;

  // The baseline module builds each schema on first use. The pure annotation
  // lets a bundler drop every schema an entry does not import, so an endpoint
  // map that takes one baseline does not carry the other two hundred. The
  // map above stays eager: createEsi validates against any of them.
  const lazy = (body: string): string =>
    `/* @__PURE__ */ z.lazy((): z.ZodType => ${body})`;
  const lazyComponents = order
    .map(
      (name) =>
        `const ${constName(name)}: z.ZodType = ${lazy(emitted.get(name)!)};\n`,
    )
    .join('');
  // Named `<operationId>Schema`, like every schema in src/schemas, which
  // also keeps a reserved-word operationId a legal declaration.
  const taken = new Set(order.map(constName));
  const exported = entries
    .map(({ id, body }) => {
      const name = baselineName(id);
      if (taken.has(name)) {
        throw new SpecGenerateError(
          `baseline ${name} for operationId "${id}" collides with a component schema`,
        );
      }
      return `/** The success body of \`${id}\`. */\nexport const ${name}: z.ZodType = ${lazy(body)};\n`;
    })
    .join('');
  const baselineSource = `${banner}${lazyComponents}\n${exported}`;

  return {
    source,
    baselineSource,
    operations: entries.length,
    components: order.length,
  };
}
