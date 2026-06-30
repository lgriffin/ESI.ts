import { EsiClient } from '../../../src/EsiClient';

export class TestWorld {
  client: EsiClient;
  result: any;
  error: any;
  results: any[] = [];

  constructor(options?: {
    timeout?: number;
    enableETagCache?: boolean;
    etagCacheConfig?: any;
  }) {
    this.client = new EsiClient({
      clientId: 'test-bdd-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: options?.timeout ?? 5000,
      ...(options?.enableETagCache !== undefined && {
        enableETagCache: options.enableETagCache,
      }),
      ...(options?.etagCacheConfig && {
        etagCacheConfig: options.etagCacheConfig,
      }),
    });
  }

  reset() {
    this.result = undefined;
    this.error = undefined;
    this.results = [];
  }
}
