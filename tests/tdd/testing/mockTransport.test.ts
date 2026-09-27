/**
 * What createMockTransport does at the fetch boundary, beyond what
 * 0057-mock-transport.feature specifies through the runtime: how a route
 * matches, how a response is encoded, and what the record holds for every
 * way `fetch` can be called.
 */
import { createEsi, identityFromToken } from '../../../src/client';
import { createMockTransport, type MockRoute } from '../../../src/testing';

const WALLET = '/characters/{character_id}/wallet';

async function json(response: Response): Promise<unknown> {
  return JSON.parse(await response.text());
}

describe('createMockTransport', () => {
  describe('matching', () => {
    it('answers the first route added that matches, in order', async () => {
      const transport = createMockTransport()
        .respond({ path: WALLET, body: 1 })
        .respond({ path: WALLET, body: 2 });
      const response = await transport(
        'https://esi.evetech.net/characters/9/wallet',
      );
      expect(await json(response)).toBe(1);
    });

    it('takes the routes given at construction before any added later', async () => {
      const routes: MockRoute[] = [{ path: '/status', body: { players: 1 } }];
      const transport = createMockTransport(routes).respond({
        path: '/status',
        body: { players: 2 },
      });
      const response = await transport('https://esi.evetech.net/status');
      expect(await json(response)).toEqual({ players: 1 });
    });

    it('matches a template segment against one path segment only', async () => {
      const transport = createMockTransport().respond({
        path: WALLET,
        body: 1,
      });
      const nested = await transport(
        'https://esi.evetech.net/characters/9/wallet/journal',
      );
      const deeper = await transport(
        'https://esi.evetech.net/characters/9/9/wallet',
      );
      expect(nested.status).toBe(501);
      expect(deeper.status).toBe(501);
    });

    it('ignores a trailing slash on the template and on the request', async () => {
      const transport = createMockTransport().respond({
        path: '/status/',
        body: {},
      });
      expect((await transport('https://esi.evetech.net/status')).status).toBe(
        200,
      );
      expect((await transport('https://esi.evetech.net/status/')).status).toBe(
        200,
      );
    });

    it('ignores the query string when a template is given', async () => {
      const transport = createMockTransport().respond({
        path: WALLET,
        body: 1,
      });
      const response = await transport(
        'https://esi.evetech.net/characters/9/wallet?datasource=tranquility',
      );
      expect(response.status).toBe(200);
    });

    it('tests a regular expression against the whole URL, query included', async () => {
      const transport = createMockTransport().respond({
        path: /\/markets\/\d+\/orders\?.*type_id=34/,
        body: [],
      });
      const hit = await transport(
        'https://esi.evetech.net/markets/10000002/orders?type_id=34',
      );
      const miss = await transport(
        'https://esi.evetech.net/markets/10000002/orders?type_id=35',
      );
      expect(hit.status).toBe(200);
      expect(miss.status).toBe(501);
    });

    it('does not let a global regular expression skip alternate matches', async () => {
      const transport = createMockTransport().respond({
        path: /\/status/g,
        body: {},
      });
      expect((await transport('https://esi.evetech.net/status')).status).toBe(
        200,
      );
      expect((await transport('https://esi.evetech.net/status')).status).toBe(
        200,
      );
    });

    it('compares the method without regard to case, and any method when omitted', async () => {
      const transport = createMockTransport()
        .respond({ method: 'post', path: '/universe/names', body: [] })
        .respond({ path: '/status', body: {} });
      const post = await transport('https://esi.evetech.net/universe/names', {
        method: 'POST',
      });
      const get = await transport('https://esi.evetech.net/universe/names');
      const del = await transport('https://esi.evetech.net/status', {
        method: 'DELETE',
      });
      expect(post.status).toBe(200);
      expect(get.status).toBe(501);
      expect(del.status).toBe(200);
    });

    it('retires a route after its times and lists the request as unrouted', async () => {
      const transport = createMockTransport().respond({
        path: '/status',
        body: {},
        times: 2,
      });
      await transport('https://esi.evetech.net/status');
      expect(transport.routes).toHaveLength(1);
      await transport('https://esi.evetech.net/status');
      expect(transport.routes).toHaveLength(0);
      const third = await transport('https://esi.evetech.net/status');
      expect(third.status).toBe(501);
      expect(transport.unrouted).toEqual([
        'GET https://esi.evetech.net/status',
      ]);
    });

    it.each([0, -1, 1.5, Number.NaN])('rejects times %p', (times) => {
      expect(() =>
        createMockTransport().respond({ path: '/status', times }),
      ).toThrow('times must be a positive integer');
    });
  });

  describe('the answer', () => {
    it('JSON-encodes an object body and labels it application/json', async () => {
      const transport = createMockTransport().respond({
        path: '/status',
        body: { players: 5 },
      });
      const response = await transport('https://esi.evetech.net/status');
      expect(response.headers.get('content-type')).toBe('application/json');
      expect(await response.text()).toBe('{"players":5}');
    });

    it('sends a string body verbatim with the headers given', async () => {
      const transport = createMockTransport().respond({
        path: '/meta/openapi.yaml',
        body: 'openapi: 3.1.0',
        headers: { 'content-type': 'application/yaml' },
      });
      const response = await transport(
        'https://esi.evetech.net/meta/openapi.yaml',
      );
      expect(response.headers.get('content-type')).toBe('application/yaml');
      expect(await response.text()).toBe('openapi: 3.1.0');
    });

    it('keeps a content-type the route sets over the JSON default', async () => {
      const transport = createMockTransport().respond({
        path: '/status',
        body: {},
        headers: { 'Content-Type': 'application/problem+json' },
      });
      const response = await transport('https://esi.evetech.net/status');
      expect(response.headers.get('content-type')).toBe(
        'application/problem+json',
      );
    });

    it('sends the status and headers of a bodiless response', async () => {
      const transport = createMockTransport().respond({
        path: '/status',
        status: 304,
        headers: { etag: '"abc"' },
      });
      const response = await transport('https://esi.evetech.net/status');
      expect(response.status).toBe(304);
      expect(response.headers.get('etag')).toBe('"abc"');
      expect(await response.text()).toBe('');
    });

    it('refuses a body on a status that cannot carry one', async () => {
      const transport = createMockTransport().respond({
        path: '/status',
        status: 204,
        body: { players: 1 },
      });
      await expect(transport('https://esi.evetech.net/status')).rejects.toThrow(
        'a 204 response cannot carry a body',
      );
    });

    it('names the request and the route table in the 501 body', async () => {
      const transport = createMockTransport().respond({
        method: 'GET',
        path: WALLET,
        body: 1,
      });
      const response = await transport('https://esi.evetech.net/status');
      expect(response.status).toBe(501);
      expect(response.statusText).toBe('No route in the mock transport');
      expect(await json(response)).toEqual({
        error:
          'createMockTransport has no route for GET https://esi.evetech.net/status (routes: GET /characters/{character_id}/wallet)',
      });
    });

    it('says when the table is empty', async () => {
      const response = await createMockTransport()(
        'https://esi.evetech.net/status',
      );
      expect(await json(response)).toEqual({
        error:
          'createMockTransport has no route for GET https://esi.evetech.net/status (no routes)',
      });
    });
  });

  describe('the record', () => {
    it('records a string URL with its init', async () => {
      const transport = createMockTransport().respond({ path: '/x', body: {} });
      await transport('https://esi.evetech.net/x?a=1', {
        method: 'post',
        headers: { 'X-User-Agent': 'app/1.0', Authorization: 'Bearer t' },
        body: '{"a":1}',
      });
      expect(transport.sent).toEqual([
        {
          method: 'POST',
          url: 'https://esi.evetech.net/x?a=1',
          headers: { 'x-user-agent': 'app/1.0', authorization: 'Bearer t' },
          body: '{"a":1}',
        },
      ]);
    });

    it('records a URL object and a Headers instance', async () => {
      const transport = createMockTransport().respond({ path: '/x', body: {} });
      await transport(new URL('https://esi.evetech.net/x'), {
        headers: new Headers({ Accept: 'application/json' }),
      });
      expect(transport.sent[0]).toEqual({
        method: 'GET',
        url: 'https://esi.evetech.net/x',
        headers: { accept: 'application/json' },
        body: undefined,
      });
    });

    it('records a Request object, with its method, headers and body', async () => {
      const transport = createMockTransport().respond({ path: '/x', body: {} });
      await transport(
        new Request('https://esi.evetech.net/x', {
          method: 'PUT',
          headers: { 'content-type': 'text/plain' },
          body: 'hello',
        }),
      );
      expect(transport.sent[0]).toEqual({
        method: 'PUT',
        url: 'https://esi.evetech.net/x',
        headers: { 'content-type': 'text/plain' },
        body: 'hello',
      });
    });

    it('records a non-string body as text', async () => {
      const transport = createMockTransport().respond({ path: '/x', body: {} });
      await transport('https://esi.evetech.net/x', {
        method: 'POST',
        body: new TextEncoder().encode('[1,2]'),
      });
      expect(transport.sent[0]!.body).toBe('[1,2]');
    });

    it('records an unrouted request too, in order with the rest', async () => {
      const transport = createMockTransport().respond({ path: '/x', body: {} });
      await transport('https://esi.evetech.net/x');
      await transport('https://esi.evetech.net/y');
      expect(transport.sent.map((request) => request.url)).toEqual([
        'https://esi.evetech.net/x',
        'https://esi.evetech.net/y',
      ]);
      expect(transport.unrouted).toEqual(['GET https://esi.evetech.net/y']);
    });

    it('hands out copies, so a test cannot edit the record by accident', async () => {
      const transport = createMockTransport().respond({ path: '/x', body: {} });
      await transport('https://esi.evetech.net/x');
      (transport.sent as unknown as unknown[]).length = 0;
      expect(transport.sent).toHaveLength(1);
      (transport.routes as unknown as unknown[]).length = 0;
      expect(transport.routes).toHaveLength(1);
    });

    it('is empty again after reset, and new routes take effect', async () => {
      const transport = createMockTransport().respond({ path: '/x', body: 1 });
      await transport('https://esi.evetech.net/x');
      transport.reset();
      expect(transport.routes).toEqual([]);
      expect(transport.sent).toEqual([]);
      expect(transport.unrouted).toEqual([]);
      transport.respond({ path: '/x', body: 2 });
      expect(await json(await transport('https://esi.evetech.net/x'))).toBe(2);
    });
  });

  describe('under the runtime', () => {
    it('serves a view without a retry and is done in one request', async () => {
      const transport = createMockTransport().respond({
        method: 'GET',
        path: WALLET,
        body: 42,
      });
      const esi = createEsi({
        userAgent: 'mock-test/1.0 (dev@example.com)',
        transport,
        logLevel: 'error',
      });
      try {
        const wallet = await esi
          .as(identityFromToken('token'))
          .character(1)
          .wallet.get();
        expect(wallet).toBe(42);
        expect(transport.sent).toHaveLength(1);
        expect(transport.sent[0]!.headers['authorization']).toBe(
          'Bearer token',
        );
      } finally {
        esi.shutdown();
      }
    });

    it('fails an unrouted request once, with the default retry budget', async () => {
      const transport = createMockTransport();
      const esi = createEsi({
        userAgent: 'mock-test/1.0 (dev@example.com)',
        transport,
        logLevel: 'error',
      });
      try {
        await expect(esi.public.status.get()).rejects.toMatchObject({
          statusCode: 501,
          message: expect.stringContaining(
            'no route for GET https://esi.evetech.net/status',
          ),
        });
        expect(transport.sent).toHaveLength(1);
      } finally {
        esi.shutdown();
      }
    });
  });
});
