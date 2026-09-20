import { buildEndpointPath } from '../../../src/core/endpoints/buildEndpointPath';
import { EndpointDefinition } from '../../../src/core/endpoints/EndpointDefinition';

describe('buildEndpointPath', () => {
  describe('path param substitution', () => {
    it('should substitute a single path param', () => {
      const def: EndpointDefinition = {
        path: 'markets/{regionId}/orders/',
        method: 'GET',
        requiresAuth: false,
        pathParams: ['regionId'],
      };
      const { path } = buildEndpointPath(def, [10000002]);
      expect(path).toBe('markets/10000002/orders/');
    });

    it('should substitute multiple path params', () => {
      const def: EndpointDefinition = {
        path: 'characters/{characterId}/contracts/{contractId}/items',
        method: 'GET',
        requiresAuth: true,
        pathParams: ['characterId', 'contractId'],
      };
      const { path } = buildEndpointPath(def, [123456, 789]);
      expect(path).toBe('characters/123456/contracts/789/items');
    });

    it('should encode path params', () => {
      const def: EndpointDefinition = {
        path: 'killmails/{killmailId}/{killmailHash}/',
        method: 'GET',
        requiresAuth: false,
        pathParams: ['killmailId', 'killmailHash'],
      };
      const { path } = buildEndpointPath(def, [1, 'abc123']);
      expect(path).toBe('killmails/1/abc123/');
    });

    it('should throw on empty path param', () => {
      const def: EndpointDefinition = {
        path: 'markets/{regionId}/orders/',
        method: 'GET',
        requiresAuth: false,
        pathParams: ['regionId'],
      };
      expect(() => buildEndpointPath(def, [null])).toThrow(/must not be empty/);
    });
  });

  describe('query params', () => {
    it('should append a single query param', () => {
      const def: EndpointDefinition = {
        path: 'markets/{regionId}/orders/',
        method: 'GET',
        requiresAuth: false,
        pathParams: ['regionId'],
        queryParams: { orderType: 'order_type' },
      };
      const { path } = buildEndpointPath(def, [10000002, 'all']);
      expect(path).toBe('markets/10000002/orders/?order_type=all');
    });

    it('should append multiple query params', () => {
      const def: EndpointDefinition = {
        path: 'test/',
        method: 'GET',
        requiresAuth: false,
        queryParams: { foo: 'f', bar: 'b' },
      };
      const { path } = buildEndpointPath(def, ['val1', 'val2']);
      expect(path).toBe('test/?f=val1&b=val2');
    });

    it('should skip undefined query params', () => {
      const def: EndpointDefinition = {
        path: 'markets/{regionId}/orders/',
        method: 'GET',
        requiresAuth: false,
        pathParams: ['regionId'],
        queryParams: { orderType: 'order_type' },
      };
      const { path } = buildEndpointPath(def, [10000002, undefined]);
      expect(path).toBe('markets/10000002/orders/');
    });
  });

  describe('datasource', () => {
    it('should append datasource with no existing query string', () => {
      const def: EndpointDefinition = {
        path: 'status/',
        method: 'GET',
        requiresAuth: false,
      };
      const { path } = buildEndpointPath(def, [], 'tranquility');
      expect(path).toBe('status/?datasource=tranquility');
    });

    it('should append datasource with existing query string', () => {
      const def: EndpointDefinition = {
        path: 'markets/{regionId}/orders/',
        method: 'GET',
        requiresAuth: false,
        pathParams: ['regionId'],
        queryParams: { orderType: 'order_type' },
      };
      const { path } = buildEndpointPath(def, [10000002, 'all'], 'singularity');
      expect(path).toBe(
        'markets/10000002/orders/?order_type=all&datasource=singularity',
      );
    });

    it('should not append datasource when undefined', () => {
      const def: EndpointDefinition = {
        path: 'status/',
        method: 'GET',
        requiresAuth: false,
      };
      const { path } = buildEndpointPath(def, []);
      expect(path).toBe('status/');
    });
  });

  describe('body extraction', () => {
    it('should extract body when hasBody is true', () => {
      const def: EndpointDefinition = {
        path: 'characters/{characterId}/assets/locations/',
        method: 'POST',
        requiresAuth: true,
        pathParams: ['characterId'],
        hasBody: true,
      };
      const { body } = buildEndpointPath(def, [123, [1, 2, 3]]);
      expect(body).toEqual([1, 2, 3]);
    });

    it('should use bodyBuilder when provided', () => {
      const def: EndpointDefinition = {
        path: 'test/',
        method: 'POST',
        requiresAuth: false,
        bodyBuilder: (ids: number[]) => ({ item_ids: ids }),
      };
      const { body } = buildEndpointPath(def, [[10, 20]]);
      expect(body).toEqual({ item_ids: [10, 20] });
    });

    it('should return undefined body for GET without hasBody', () => {
      const def: EndpointDefinition = {
        path: 'status/',
        method: 'GET',
        requiresAuth: false,
      };
      const { body } = buildEndpointPath(def, []);
      expect(body).toBeUndefined();
    });
  });
});
