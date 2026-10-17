/**
 * The root entry exports the pipeline pieces only the legacy tree needs as
 * deprecated aliases (src/legacyExports.ts, guides/LEGACY-REMOVAL.md). Until
 * 13.0.0 removes them, each alias must be the very object the pipeline uses,
 * so `instanceof`, identity checks and module mocks behave as before, and
 * each type alias must stay interchangeable with the declaration behind it.
 */
import * as root from '../../../src';
import type {
  BatchOptions,
  BatchResult,
  CacheStats,
  CircuitBreakerStats,
  ConfigureApiClientResult,
  CreateClientOptions,
  CursorOptions,
  CursorResult,
  CursorTokens,
  DeprecationInfo,
  EsiClientConfig,
  InferEndpointResult,
  PageResult,
  UnwrapArray,
  WithMetadata,
  WithSafeMode,
} from '../../../src';
import { ApiClient as CoreApiClient } from '../../../src/core/ApiClient';
import { batchFetch, batchPost } from '../../../src/core/BatchRequestHandler';
import { configureApiClient } from '../../../src/core/configureApiClient';
import { EsiDiagnostics } from '../../../src/core/EsiDiagnostics';
import { buildEndpointPath } from '../../../src/core/endpoints/buildEndpointPath';
import { fetchAllCursorPages } from '../../../src/core/endpoints/createClient';
import type * as createClientTypes from '../../../src/core/endpoints/createClient';
import type * as batchTypes from '../../../src/core/BatchRequestHandler';
import type * as diagnosticsTypes from '../../../src/core/EsiDiagnostics';
import type * as pageTypes from '../../../src/core/pagination/AsyncPaginationIterator';
import {
  fetchAllPages,
  fetchPages,
} from '../../../src/core/pagination/AsyncPaginationIterator';

/** Compiles only when A and B are mutually assignable. */
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const same = <A, B>(proof: Same<A, B>): boolean => proof;

describe('deprecated root aliases', () => {
  it('export the same values the pipeline uses', () => {
    expect(root.ApiClient).toBe(CoreApiClient);
    expect(root.configureApiClient).toBe(configureApiClient);
    expect(root.buildEndpointPath).toBe(buildEndpointPath);
    expect(root.fetchAllCursorPages).toBe(fetchAllCursorPages);
    expect(root.fetchAllPages).toBe(fetchAllPages);
    expect(root.fetchPages).toBe(fetchPages);
    expect(root.batchFetch).toBe(batchFetch);
    expect(root.batchPost).toBe(batchPost);
    expect(root.EsiDiagnostics).toBe(EsiDiagnostics);
  });

  it('keep instanceof working across the alias', () => {
    const client = new root.ApiClient('alias-test', 'https://esi.evetech.net');
    expect(client).toBeInstanceOf(CoreApiClient);
    const typed: root.ApiClient = new CoreApiClient(
      'alias-test',
      'https://esi.evetech.net',
    );
    expect(typed.getClientId()).toBe('alias-test');
  });

  it('keep the type aliases interchangeable with their declarations', () => {
    const proofs = [
      same<CreateClientOptions, createClientTypes.CreateClientOptions>(true),
      same<CursorOptions, createClientTypes.CursorOptions>(true),
      same<CursorResult<number>, createClientTypes.CursorResult<number>>(true),
      same<UnwrapArray<string[]>, createClientTypes.UnwrapArray<string[]>>(
        true,
      ),
      same<
        InferEndpointResult<{ cursorPagination: true }>,
        createClientTypes.InferEndpointResult<{ cursorPagination: true }>
      >(true),
      same<
        WithMetadata<{ f(): Promise<number> }>,
        createClientTypes.WithMetadata<{ f(): Promise<number> }>
      >(true),
      same<
        WithSafeMode<{ f(): Promise<number> }>,
        createClientTypes.WithSafeMode<{ f(): Promise<number> }>
      >(true),
      same<PageResult<number>, pageTypes.PageResult<number>>(true),
      same<BatchOptions, batchTypes.BatchOptions>(true),
      same<BatchResult<number, string>, batchTypes.BatchResult<number, string>>(
        true,
      ),
      same<CacheStats, diagnosticsTypes.CacheStats>(true),
      same<CircuitBreakerStats, diagnosticsTypes.CircuitBreakerStats>(true),
    ];
    const config: EsiClientConfig = { timeout: 1 };
    const result: ConfigureApiClientResult = { deduplicator: null };
    const info: DeprecationInfo = { message: 'gone' };
    const cursors: CursorTokens = { before: null, after: null };
    expect(proofs.every(Boolean)).toBe(true);
    expect([config.timeout, result.deduplicator, info.message]).toEqual([
      1,
      null,
      'gone',
    ]);
    expect(cursors).toEqual({ before: null, after: null });
  });

  it('collects every page through the root fetchAllCursorPages', async () => {
    const pages: Record<string, { items: number[]; after?: string }> = {
      start: { items: [1, 2], after: 'b' },
      b: { items: [3] },
    };
    const all = await root.fetchAllCursorPages(
      (_before, after) => Promise.resolve(pages[after ?? 'start']!),
      (r) => r.items,
      (r) => ({ after: r.after }),
    );
    expect(all).toEqual([1, 2, 3]);
  });
});
