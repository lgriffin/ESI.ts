import { ApiClient, FetchLike } from '../../../src/core/ApiClient';

describe('FetchLike injection', () => {
  it('should default to globalThis.fetch when none is set', () => {
    const client = new ApiClient('test', 'https://esi.evetech.net/latest');
    const currentGlobalFetch = globalThis.fetch;
    expect(client.getFetch()).toBe(currentGlobalFetch);
  });

  it('should accept a custom fetch function', () => {
    const client = new ApiClient('test', 'https://esi.evetech.net/latest');
    const customFetch: FetchLike = jest.fn();

    client.setFetch(customFetch);

    expect(client.getFetch()).toBe(customFetch);
  });

  it('should serialize hasFetch in toJSON when custom fetch is set', () => {
    const client = new ApiClient('test', 'https://esi.evetech.net/latest');
    const json = client.toJSON();

    expect(json).toHaveProperty('link');
    expect(json).toHaveProperty('timeout');
  });
});
