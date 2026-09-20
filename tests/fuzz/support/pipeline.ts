/**
 * The request pipeline as a property's subject: every module a property
 * drives, loaded from one module registry.
 *
 * `requirePipeline()` loads the real code. `mutantPipeline(mock)` loads the
 * same modules into a fresh registry after `mock` has registered its
 * `jest.doMock` replacements, so a known-bad variant of one stage runs inside
 * an otherwise real pipeline without touching the real one. Call `jest.doMock`
 * from the test file, with paths relative to that file.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
import type { ApiClient } from '../../../src/core/ApiClient';
import type { configureApiClient } from '../../../src/core/configureApiClient';
import type { ETagCacheManager } from '../../../src/core/cache/ETagCacheManager';
import type { buildCacheKey } from '../../../src/core/cache/cacheKey';
import type { AssetsClient } from '../../../src/clients/AssetsClient';
import type { FreelanceJobsClient } from '../../../src/clients/FreelanceJobsClient';
import type { MarketClient } from '../../../src/clients/MarketClient';
import type { StatusClient } from '../../../src/clients/StatusClient';
import type { UniverseClient } from '../../../src/clients/UniverseClient';
import type { WalletClient } from '../../../src/clients/WalletClient';
import type { fetchAllCursorPages } from '../../../src/core/endpoints/createClient';

export interface Pipeline {
  ApiClient: typeof ApiClient;
  configureApiClient: typeof configureApiClient;
  ETagCacheManager: typeof ETagCacheManager;
  buildCacheKey: typeof buildCacheKey;
  AssetsClient: typeof AssetsClient;
  FreelanceJobsClient: typeof FreelanceJobsClient;
  MarketClient: typeof MarketClient;
  StatusClient: typeof StatusClient;
  UniverseClient: typeof UniverseClient;
  WalletClient: typeof WalletClient;
  fetchAllCursorPages: typeof fetchAllCursorPages;
}

export function requirePipeline(): Pipeline {
  return {
    ApiClient: (
      require('../../../src/core/ApiClient') as typeof import('../../../src/core/ApiClient')
    ).ApiClient,
    configureApiClient: (
      require('../../../src/core/configureApiClient') as typeof import('../../../src/core/configureApiClient')
    ).configureApiClient,
    ETagCacheManager: (
      require('../../../src/core/cache/ETagCacheManager') as typeof import('../../../src/core/cache/ETagCacheManager')
    ).ETagCacheManager,
    buildCacheKey: (
      require('../../../src/core/cache/cacheKey') as typeof import('../../../src/core/cache/cacheKey')
    ).buildCacheKey,
    AssetsClient: (
      require('../../../src/clients/AssetsClient') as typeof import('../../../src/clients/AssetsClient')
    ).AssetsClient,
    FreelanceJobsClient: (
      require('../../../src/clients/FreelanceJobsClient') as typeof import('../../../src/clients/FreelanceJobsClient')
    ).FreelanceJobsClient,
    MarketClient: (
      require('../../../src/clients/MarketClient') as typeof import('../../../src/clients/MarketClient')
    ).MarketClient,
    StatusClient: (
      require('../../../src/clients/StatusClient') as typeof import('../../../src/clients/StatusClient')
    ).StatusClient,
    UniverseClient: (
      require('../../../src/clients/UniverseClient') as typeof import('../../../src/clients/UniverseClient')
    ).UniverseClient,
    WalletClient: (
      require('../../../src/clients/WalletClient') as typeof import('../../../src/clients/WalletClient')
    ).WalletClient,
    fetchAllCursorPages: (
      require('../../../src/core/endpoints/createClient') as typeof import('../../../src/core/endpoints/createClient')
    ).fetchAllCursorPages,
  };
}

/** A loader for the pipeline with `mock`'s `jest.doMock` calls applied. */
export function mutantPipeline(mock: () => void): () => Pipeline {
  return () => {
    let pipeline: Pipeline | undefined;
    jest.isolateModules(() => {
      mock();
      pipeline = requirePipeline();
    });
    return pipeline!;
  };
}
