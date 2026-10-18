import type { EndpointDefinition, HttpMethod } from './EndpointDefinition';
import { esiOperations, type EsiOperationId } from './esi-operations.generated';

/**
 * What a custom client adds to an operation: everything an
 * `EndpointDefinition` holds except the facts the spec states. Path
 * parameters are named in the custom client's own words (`regionId`), in the
 * order the method takes them.
 */
export type CustomEndpointPart = Omit<
  EndpointDefinition,
  'operation' | 'path' | 'method' | 'requiresAuth'
> & {
  /**
   * End the path with `/`, as the definition did before it was derived. ESI
   * serves both forms; keeping the slash keeps the URL, and so the cache key
   * and every recorded expectation, exactly as it was. Not copied into the
   * definition.
   */
  trailingSlash?: true;
};

type Row<Id extends EsiOperationId> = (typeof esiOperations)[Id];

/** The definition `fromOperation` builds: the spec's facts, then the custom part. */
export type OperationEndpoint<
  Id extends EsiOperationId,
  C extends CustomEndpointPart,
> = {
  readonly operation: Id;
  readonly path: string;
  readonly method: Row<Id>['method'];
  readonly requiresAuth: Row<Id>['scopes'] extends readonly [] ? false : true;
} & (Row<Id> extends { readonly textResponse: infer T }
  ? { readonly textResponse: T }
  : unknown) &
  (Row<Id> extends { readonly emptyWhenNoContent: true }
    ? { readonly emptyWhenNoContent: true }
    : unknown) &
  Omit<C, 'trailingSlash'>;

const camelCase = (name: string): string =>
  name.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/**
 * The spec's template (`/markets/{region_id}/orders`) in the form the
 * pipeline builds URLs from (`markets/{regionId}/orders`): no leading slash,
 * and each placeholder renamed to the custom client's path parameter. A spec
 * name matches its camelCase form (`region_id` is `regionId`); when the
 * custom names differ (`origin` for `origin_system_id`), they are matched by
 * position, which is also the order the spec's template names them.
 *
 * @throws Error when the custom client names a different number of path
 * parameters than the template has.
 */
export function customPath(
  operationId: string,
  template: string,
  pathParams: readonly string[] = [],
  trailingSlash = false,
): string {
  // Segments of the template: a placeholder is a whole segment in ESI paths.
  const segments = template.replace(/^\//, '').split('/');
  const isPlaceholder = (seg: string): boolean =>
    seg.startsWith('{') && seg.endsWith('}');
  const names = segments.filter(isPlaceholder).map((s) => s.slice(1, -1));
  if (names.length !== pathParams.length) {
    throw new Error(
      `${operationId}: the spec's path ${template} has ${names.length} parameter(s) but the endpoint names ${pathParams.length} (${pathParams.join(', ') || 'none'})`,
    );
  }
  const byName = names.every((n) => pathParams.includes(camelCase(n)));
  let position = 0;
  const path = segments
    .map((seg) => {
      if (!isPlaceholder(seg)) return seg;
      const param = byName
        ? camelCase(seg.slice(1, -1))
        : pathParams.at(position);
      position += 1;
      return `{${param}}`;
    })
    .join('/');
  return trailingSlash ? `${path}/` : path;
}

/**
 * An endpoint definition built from the generated route table: the path,
 * method and whether a token is needed come from the spec's operation, and
 * so do a text response and an empty answer read as `[]` when the spec
 * declares them. Everything else is the custom client's (method name,
 * argument order, query parameters, body builder, schemas, cursor handling),
 * and the custom part wins where both say something, which is where a wire
 * fix the spec gets wrong belongs. See guides/CLIENT-ARCHITECTURE.md, plan
 * step 2.
 */
export function fromOperation<
  const Id extends EsiOperationId,
  const C extends CustomEndpointPart = Record<never, never>,
>(operationId: Id, custom?: C): OperationEndpoint<Id, C> {
  const row: {
    readonly method: HttpMethod;
    readonly path: string;
    readonly scopes: readonly string[];
    readonly textResponse?: { readonly accept: string };
    readonly emptyWhenNoContent?: boolean;
    // eslint-disable-next-line security/detect-object-injection -- a key of the generated table, checked by the type
  } = esiOperations[operationId];
  const { trailingSlash, ...part } = (custom ?? {}) as CustomEndpointPart;
  return {
    operation: operationId,
    path: customPath(operationId, row.path, part.pathParams, trailingSlash),
    method: row.method,
    requiresAuth: row.scopes.length > 0,
    ...(row.textResponse ? { textResponse: { ...row.textResponse } } : {}),
    ...(row.emptyWhenNoContent ? { emptyWhenNoContent: true } : {}),
    ...part,
  } as unknown as OperationEndpoint<Id, C>;
}
