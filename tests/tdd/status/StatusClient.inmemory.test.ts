import { StatusClient } from '../../../src/clients/StatusClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { createNoopLogger } from '../../../src/core/logger/NoopLogger';
import { setLogger } from '../../../src/core/logger/loggerUtil';
import { InMemoryFetch } from '../helpers/InMemoryFetch';

describe('StatusClient (InMemoryFetch)', () => {
  let statusClient: StatusClient;
  let inMemoryFetch: InMemoryFetch;

  beforeEach(() => {
    setLogger(createNoopLogger());
    inMemoryFetch = new InMemoryFetch();

    const client = new ApiClientBuilder()
      .setClientId('test')
      .setLink('https://esi.evetech.net/latest')
      .setFetch(inMemoryFetch.fetch)
      .build();

    statusClient = new StatusClient(client);
  });

  it('should return server status', async () => {
    inMemoryFetch.stub({
      body: {
        players: 12345,
        start_time: '2024-07-01T18:57:11Z',
        server_version: '1.2.3',
      },
    });

    const result = await statusClient.getStatus();

    expect(result.players).toBe(12345);
    expect(result.start_time).toBe('2024-07-01T18:57:11Z');
    expect(result.server_version).toBe('1.2.3');
  });

  it('should hit the correct endpoint', async () => {
    inMemoryFetch.stub({
      body: {
        players: 1,
        start_time: '2024-01-01T00:00:00Z',
        server_version: '1.0.0',
      },
    });

    await statusClient.getStatus();

    expect(inMemoryFetch.calls).toHaveLength(1);
    expect(inMemoryFetch.calls[0].url).toContain('/status');
  });

  it('should handle server errors', async () => {
    inMemoryFetch.stub({
      status: 500,
      body: { error: 'Internal server error' },
    });

    await expect(statusClient.getStatus()).rejects.toThrow();
  });
});
