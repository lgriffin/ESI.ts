import { InMemoryFetch } from './InMemoryFetch';

describe('InMemoryFetch', () => {
  let inMemoryFetch: InMemoryFetch;

  beforeEach(() => {
    inMemoryFetch = new InMemoryFetch();
  });

  it('should return stubbed response', async () => {
    inMemoryFetch.stub({ body: { id: 1, name: 'Test' }, status: 200 });

    const response = await inMemoryFetch.fetch('https://esi.evetech.net/test');

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ id: 1, name: 'Test' });
  });

  it('should record calls', async () => {
    inMemoryFetch.stub({ body: {} });

    await inMemoryFetch.fetch('https://esi.evetech.net/test', {
      method: 'GET',
    });

    expect(inMemoryFetch.calls).toHaveLength(1);
    expect(inMemoryFetch.calls[0].url).toBe('https://esi.evetech.net/test');
    expect(inMemoryFetch.calls[0].init?.method).toBe('GET');
  });

  it('should serve responses in FIFO order', async () => {
    inMemoryFetch.stub({ body: { order: 1 } }).stub({ body: { order: 2 } });

    const first = await inMemoryFetch.fetch('https://esi.evetech.net/a');
    const second = await inMemoryFetch.fetch('https://esi.evetech.net/b');

    expect(await first.json()).toEqual({ order: 1 });
    expect(await second.json()).toEqual({ order: 2 });
  });

  it('should throw when no stubbed response is available', async () => {
    await expect(
      inMemoryFetch.fetch('https://esi.evetech.net/missing'),
    ).rejects.toThrow('InMemoryFetch: no stubbed response');
  });

  it('should support custom status codes', async () => {
    inMemoryFetch.stub({ status: 404, body: { error: 'Not Found' } });

    const response = await inMemoryFetch.fetch('https://esi.evetech.net/test');

    expect(response.status).toBe(404);
  });

  it('should support custom headers', async () => {
    inMemoryFetch.stub({
      body: [],
      headers: { 'x-pages': '5', 'x-esi-request-id': 'custom-id' },
    });

    const response = await inMemoryFetch.fetch('https://esi.evetech.net/test');

    expect(response.headers.get('x-pages')).toBe('5');
    expect(response.headers.get('x-esi-request-id')).toBe('custom-id');
  });

  it('should add default x-esi-request-id header when not provided', async () => {
    inMemoryFetch.stub({ body: {} });

    const response = await inMemoryFetch.fetch('https://esi.evetech.net/test');

    expect(response.headers.get('x-esi-request-id')).toBe('test-request-id');
  });

  it('should reset calls and responses', async () => {
    inMemoryFetch.stub({ body: {} });
    await inMemoryFetch.fetch('https://esi.evetech.net/test');

    inMemoryFetch.reset();

    expect(inMemoryFetch.calls).toHaveLength(0);
    await expect(
      inMemoryFetch.fetch('https://esi.evetech.net/test'),
    ).rejects.toThrow();
  });

  it('should default to status 200', async () => {
    inMemoryFetch.stub({ body: 'ok' });

    const response = await inMemoryFetch.fetch('https://esi.evetech.net/test');

    expect(response.status).toBe(200);
  });

  it('should handle empty body', async () => {
    inMemoryFetch.stub({ status: 204 });

    const response = await inMemoryFetch.fetch('https://esi.evetech.net/test');

    expect(response.status).toBe(204);
    const text = await response.text();
    expect(text).toBe('');
  });
});
