/**
 * DES-02 as a check: every hand-written endpoint definition whose operation
 * returns a JSON body in the vendored OpenAPI document declares a
 * `responseSchema`, so its result is validated and its inferred type is not
 * `unknown`. A 204 operation needs none, and a `textResponse` definition
 * returns a document rather than JSON.
 *
 * Pure functions with no I/O; scripts/spec/spec-response-schemas.ts is the CLI.
 */
import { pathShape } from './schema-drift-core';
import type { OpenApiDocument } from './spec-generate-core';

interface ResponseLike {
  readonly content?: Record<string, unknown>;
}

interface OperationLike {
  readonly responses?: Record<string, ResponseLike>;
}

/** One definition as the check sees it. */
export interface DefinitionRef {
  /** `mailEndpoints.sendMail` */
  readonly endpoint: string;
  readonly path: string;
  readonly method: string;
  readonly hasResponseSchema: boolean;
  readonly textResponse: boolean;
}

export interface ResponseSchemaReport {
  readonly checked: number;
  readonly problems: readonly string[];
}

/** Every endpoint definition in the loaded `*Endpoints.ts` modules. */
export function definitionsOf(
  modules: Record<string, Record<string, unknown>>,
): DefinitionRef[] {
  const refs: DefinitionRef[] = [];
  for (const file of Object.keys(modules).sort()) {
    for (const [mapName, exported] of Object.entries(modules[file]!)) {
      if (typeof exported !== 'object' || exported === null) continue;
      for (const [name, def] of Object.entries(exported)) {
        const d = def as Partial<Record<string, unknown>> | null;
        if (
          typeof d !== 'object' ||
          d === null ||
          typeof d.path !== 'string' ||
          typeof d.method !== 'string'
        ) {
          continue;
        }
        refs.push({
          endpoint: `${mapName}.${name}`,
          path: d.path,
          method: d.method.toLowerCase(),
          hasResponseSchema: d.responseSchema !== undefined,
          textResponse: d.textResponse !== undefined,
        });
      }
    }
  }
  return refs;
}

/** Whether any 2xx response of the operation carries a JSON body. */
export function returnsJsonBody(op: OperationLike): boolean {
  return Object.entries(op.responses ?? {}).some(
    ([status, response]) =>
      /^2\d\d$/.test(status) &&
      response.content?.['application/json'] !== undefined,
  );
}

export function checkResponseSchemas(
  doc: OpenApiDocument,
  definitions: readonly DefinitionRef[],
): ResponseSchemaReport {
  const operations = new Map<string, OperationLike>();
  for (const [path, item] of Object.entries(doc.paths)) {
    for (const [method, op] of Object.entries(
      item as Record<string, unknown>,
    )) {
      operations.set(`${method} ${pathShape(path)}`, op as OperationLike);
    }
  }

  const problems: string[] = [];
  let checked = 0;
  for (const def of definitions) {
    if (def.textResponse) continue;
    const op = operations.get(`${def.method} ${pathShape(def.path)}`);
    // spec:coverage and schema drift own definitions the spec lacks.
    if (!op) continue;
    checked++;
    if (returnsJsonBody(op) && !def.hasResponseSchema) {
      problems.push(
        `${def.endpoint} (${def.method.toUpperCase()} ${def.path}) returns a JSON body but declares no responseSchema`,
      );
    }
  }
  return { checked, problems };
}
