/**
 * Every domain client's metadata or safe-mode view from one call:
 * `client.withMetadata().market` is `client.market.withMetadata()`, for
 * `EsiClient` and `CustomEsiClient` alike. The views come from each domain
 * client's own `withMetadata()` / `withSafeMode()`, so the metadata is built
 * by the same `buildResponseMeta` the shared runtime's views use.
 */
import { type ApiClientType, CLIENT_TYPES } from './ClientRegistry';

/** The names of `T`'s properties that hold a domain client, possibly undefined. */
export type DomainClientName<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends {
    withMetadata(): unknown;
    withSafeMode(): unknown;
  }
    ? K
    : never;
}[keyof T];

/**
 * `T`'s domain clients, each as its `withMetadata()` view: every method that
 * answers once resolves `{ data, meta }`. A domain `T` may not hold (a
 * `CustomEsiClient` built without it) is `undefined`.
 */
export type MetadataClients<T> = {
  readonly [K in DomainClientName<T>]: T[K] extends infer C
    ? C extends { withMetadata(): infer R }
      ? R
      : undefined
    : never;
};

/**
 * `T`'s domain clients, each as its `withSafeMode()` view: every method that
 * answers once resolves `{ ok: true, data, meta }` or `{ ok: false, error }`
 * instead of rejecting. A domain `T` may not hold is `undefined`.
 */
export type SafeModeClients<T> = {
  readonly [K in DomainClientName<T>]: T[K] extends infer C
    ? C extends { withSafeMode(): infer R }
      ? R
      : undefined
    : never;
};

/**
 * A frozen object with a lazy getter per registered domain: each asks
 * `lookup` for the domain client and returns its view, or undefined when
 * there is no such client.
 */
export function domainClientViews<V>(
  lookup: (
    name: ApiClientType,
  ) => { withMetadata(): unknown; withSafeMode(): unknown } | undefined,
  mode: 'metadata' | 'safe',
): V {
  const view: Record<string, unknown> = {};
  for (const name of CLIENT_TYPES) {
    Object.defineProperty(view, name, {
      enumerable: true,
      get: () => {
        const client = lookup(name);
        if (!client) return undefined;
        return mode === 'metadata'
          ? client.withMetadata()
          : client.withSafeMode();
      },
    });
  }
  return Object.freeze(view) as V;
}
