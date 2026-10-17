/**
 * The runtime's metadata and safe-mode views (`esi.withMetadata()`,
 * `esi.withSafeMode()`): the same generated scope tree over a transport that
 * returns `{ data, meta }`, or `{ ok, ... }` instead of throwing. Only the
 * operations that answer once change shape; a paginated operation still
 * yields its items.
 */
import {
  PipelineTransport,
  type PipelineTransportOptions,
} from '../adapters/PipelineTransport';
import type { ApiClient } from '../core/ApiClient';
import type {
  OperationMeta,
  OperationRequest,
  OperationTransport,
} from '../core/ports/OperationTransport';
import type { EsiHandlerResponse } from '../core/requestPipeline/cachePolicy';
import { buildResponseMeta, type ResponseMeta } from '../core/responseMeta';
import { type EsiError, toEsiError } from '../core/util/error';
import type { Identity } from '../core/ports/Identity';

/** What a metadata view's operation resolves with. */
export interface OperationResponse<T> {
  readonly data: T;
  readonly meta: ResponseMeta;
}

/**
 * What a safe-mode view's operation resolves with. A failure carries the
 * `EsiError` the plain view would have thrown; any other thrown value is
 * wrapped in an `EsiFaultError` coded `ESIJS_ERROR`.
 */
export type OperationResult<T> =
  | { readonly ok: true; readonly data: T; readonly meta: ResponseMeta }
  | { readonly ok: false; readonly error: EsiError };

type MetadataReturn<R> =
  R extends Promise<infer V>
    ? Promise<OperationResponse<V>>
    : R extends AsyncIterable<unknown>
      ? R
      : MetadataView<R>;

/**
 * A scope tree whose single-answer operations resolve with
 * `OperationResponse`. Paginated operations keep their `AsyncIterable`.
 */
export type MetadataView<T> = T extends (...args: infer A) => infer R
  ? ((...args: A) => MetadataReturn<R>) & {
      readonly [K in keyof T]: MetadataView<T[K]>;
    }
  : T extends AsyncIterable<unknown>
    ? T
    : T extends object
      ? { readonly [K in keyof T]: MetadataView<T[K]> }
      : T;

type SafeReturn<R> =
  R extends Promise<infer V>
    ? Promise<OperationResult<V>>
    : R extends AsyncIterable<unknown>
      ? R
      : SafeView<R>;

/**
 * A scope tree whose single-answer operations resolve with `OperationResult`
 * and never reject. Paginated operations keep their `AsyncIterable`, which
 * rejects as the plain view's does.
 */
export type SafeView<T> = T extends (...args: infer A) => infer R
  ? ((...args: A) => SafeReturn<R>) & {
      readonly [K in keyof T]: SafeView<T[K]>;
    }
  : T extends AsyncIterable<unknown>
    ? T
    : T extends object
      ? { readonly [K in keyof T]: SafeView<T[K]> }
      : T;

/** A public view and a view per identity, as `Esi` hands them out. */
export interface EsiViews<TPublic, TScoped> {
  /** The operations that need no scope. */
  readonly public: TPublic;
  /** Every operation, as `identity`; the same `Identity` gets the same view back. */
  as(identity: Identity): TScoped;
}

/** Resolves each request with the body and the metadata of its response. */
export class MetadataTransport implements OperationTransport {
  constructor(
    private readonly client: ApiClient,
    private readonly options: PipelineTransportOptions = {},
  ) {}

  async request<T>(meta: OperationMeta, req: OperationRequest): Promise<T> {
    let seen: EsiHandlerResponse | undefined;
    const data = await new PipelineTransport(this.client, {
      ...this.options,
      observe: (response) => {
        seen = response;
      },
    }).request<unknown>(meta, req);
    const answer: OperationResponse<unknown> = {
      data,
      meta: buildResponseMeta(seen ?? { headers: {}, body: data }),
    };
    return answer as T;
  }

  paginate<T>(meta: OperationMeta, req: OperationRequest): AsyncIterable<T> {
    return new PipelineTransport(this.client, this.options).paginate<T>(
      meta,
      req,
    );
  }
}

/**
 * Turns a metadata transport's answers and failures into results. It sits
 * outside the public and identity guards, so their refusals become results
 * too.
 */
export class SafeTransport implements OperationTransport {
  constructor(private readonly inner: OperationTransport) {}

  async request<T>(meta: OperationMeta, req: OperationRequest): Promise<T> {
    let result: OperationResult<unknown>;
    try {
      const answer = await this.inner.request<OperationResponse<unknown>>(
        meta,
        req,
      );
      result = { ok: true, data: answer.data, meta: answer.meta };
    } catch (err) {
      result = { ok: false, error: toEsiError(err) };
    }
    return result as T;
  }

  paginate<T>(meta: OperationMeta, req: OperationRequest): AsyncIterable<T> {
    return this.inner.paginate<T>(meta, req);
  }
}
