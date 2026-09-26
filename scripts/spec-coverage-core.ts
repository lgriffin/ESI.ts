/**
 * Coverage gate for the generated operations (Phase 1 of the Road to Done
 * plan): every operation in the vendored OpenAPI document has exactly one
 * generated `*Meta` constant that agrees with it on method, path, SSO scopes,
 * pagination and deprecation, and no generated operation is missing from the
 * document.
 *
 * It reads the committed module, not a fresh emit, so a hand edit or a stale
 * file fails here even if the emitter itself is right.
 */
import {
  functionNameFor,
  type OpenApiDocument,
  type Pagination,
} from './spec-generate-core';

export interface MetaLike {
  readonly operationId: string;
  readonly method: string;
  readonly path: string;
  readonly scopes: readonly string[];
  readonly pagination: Pagination;
  readonly deprecated: boolean;
}

export interface CoverageReport {
  readonly specOperations: number;
  readonly generatedOperations: number;
  readonly problems: readonly string[];
}

const METHODS = ['get', 'post', 'put', 'delete'] as const;

/** Picks every exported `*Meta` constant out of the generated module. */
export function metasOf(mod: Record<string, unknown>): Map<string, MetaLike> {
  const metas = new Map<string, MetaLike>();
  for (const [name, value] of Object.entries(mod)) {
    if (name.endsWith('Meta') && value && typeof value === 'object') {
      metas.set(name.slice(0, -'Meta'.length), value as MetaLike);
    }
  }
  return metas;
}

function expectedPagination(
  params: readonly { in?: string; name?: string }[],
): Pagination {
  const query = new Set(
    params.filter((p) => p.in === 'query').map((p) => p.name),
  );
  if (query.has('page')) return 'page';
  if (query.has('before') || query.has('after')) return 'cursor';
  return 'none';
}

export function checkCoverage(
  doc: OpenApiDocument,
  generated: Map<string, MetaLike>,
): CoverageReport {
  const problems: string[] = [];
  const seen = new Set<string>();
  let specOperations = 0;

  for (const [path, item] of Object.entries(doc.paths)) {
    for (const method of METHODS) {
      const op = item[method];
      if (!op) continue;
      specOperations++;
      const route = `${method.toUpperCase()} ${path}`;
      const fn = functionNameFor(op.operationId);
      const meta = generated.get(fn);
      if (!meta) {
        problems.push(
          `${route} (${op.operationId}) has no generated operation`,
        );
        continue;
      }
      seen.add(fn);
      const params = [...(item.parameters ?? []), ...(op.parameters ?? [])];
      const scopes = [
        ...new Set<string>(
          (op.security ?? []).flatMap((s: Record<string, string[]>) =>
            Object.values(s).flat(),
          ),
        ),
      ];
      const want: Omit<MetaLike, 'operationId'> = {
        method: method.toUpperCase(),
        path,
        scopes,
        pagination: expectedPagination(params),
        deprecated: op.deprecated === true,
      };
      for (const key of Object.keys(want) as (keyof typeof want)[]) {
        const a = JSON.stringify(meta[key]);
        const b = JSON.stringify(want[key]);
        if (a !== b)
          problems.push(`${route}: generated ${key} is ${a}, spec says ${b}`);
      }
    }
  }

  for (const fn of generated.keys()) {
    if (!seen.has(fn)) problems.push(`generated ${fn} is not in the spec`);
  }

  return { specOperations, generatedOperations: generated.size, problems };
}
