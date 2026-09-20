import { EsiClient } from '../../../../src/EsiClient';

export interface TestClientOptions {
  clientId?: string;
  baseUrl?: string;
  timeout?: number;
}

export function createTestEsiClient(options?: TestClientOptions): EsiClient {
  return new EsiClient({
    clientId: options?.clientId ?? 'test-bdd-client',
    baseUrl: options?.baseUrl ?? 'https://esi.evetech.net',
    timeout: options?.timeout ?? 5000,
  });
}
