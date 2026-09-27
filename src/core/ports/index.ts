/**
 * The ports: the seams the pipeline talks to, and the only things a new
 * adapter or the builder in a later Phase 2 PR needs to implement. They
 * import nothing (the layer rule enforces it). The `./client` entry exports
 * them.
 */
export type { CacheStore, CachedResponse } from './CacheStore';
export type { Clock } from './Clock';
export type { HttpTransport } from './HttpTransport';
export type { Identity } from './Identity';
export type { LogFields, Logger } from './Logger';
export type {
  OperationMeta,
  OperationPagination,
  OperationRequest,
  OperationTransport,
  QueryValue,
} from './OperationTransport';
export type { TokenProvider } from './TokenProvider';
