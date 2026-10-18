/**
 * fromOperation builds a custom endpoint definition from the generated route
 * table (option D step 2, #671): the spec's path, method and whether a token
 * is needed, with the custom client's part on top. See
 * guides/CLIENT-ARCHITECTURE.md.
 */
import { z } from 'zod';
import {
  customPath,
  fromOperation,
} from '../../../src/core/endpoints/fromOperation';
import { esiOperations } from '../../../src/core/endpoints/esi-operations.generated';
import { statusEndpoints } from '../../../src/core/endpoints/statusEndpoints';
import { marketEndpoints } from '../../../src/core/endpoints/marketEndpoints';

describe('customPath', () => {
  it('drops the leading slash and renames each placeholder to its camelCase parameter', () => {
    expect(
      customPath('GetX', '/markets/{region_id}/orders', ['regionId']),
    ).toBe('markets/{regionId}/orders');
  });

  it('matches by name when the custom order differs from the template', () => {
    expect(
      customPath('GetX', '/characters/{character_id}/mail/{mail_id}', [
        'mailId',
        'characterId',
      ]),
    ).toBe('characters/{characterId}/mail/{mailId}');
  });

  it('matches by position when the custom names are its own', () => {
    expect(
      customPath(
        'GetRoute',
        '/route/{origin_system_id}/{destination_system_id}',
        ['origin', 'destination'],
      ),
    ).toBe('route/{origin}/{destination}');
  });

  it('keeps a trailing slash only when asked', () => {
    expect(customPath('GetStatus', '/status')).toBe('status');
    expect(customPath('GetStatus', '/status', [], true)).toBe('status/');
  });

  it('refuses a parameter count that differs from the template', () => {
    expect(() => customPath('GetX', '/alliances/{alliance_id}', [])).toThrow(
      "GetX: the spec's path /alliances/{alliance_id} has 1 parameter(s) but the endpoint names 0 (none)",
    );
  });
});

describe('fromOperation', () => {
  it('takes the method, path and token requirement from the operation', () => {
    const def = fromOperation('GetCharactersCharacterIdOrders', {
      pathParams: ['characterId'],
    });
    expect(def).toEqual({
      operation: 'GetCharactersCharacterIdOrders',
      method: 'GET',
      path: 'characters/{characterId}/orders',
      requiresAuth: true,
      pathParams: ['characterId'],
    });
  });

  it('carries a text response and an empty answer the spec declares', () => {
    expect(fromOperation('GetMetaOpenapiYaml').textResponse).toEqual(
      esiOperations.GetMetaOpenapiYaml.textResponse,
    );
    expect(
      fromOperation('GetContractsPublicBidsContractId', {
        pathParams: ['contractId'],
      }).emptyWhenNoContent,
    ).toBe(true);
  });

  it('lets the custom part win, and does not copy trailingSlash', () => {
    const schema = z.number();
    const def = fromOperation('GetStatus', {
      trailingSlash: true,
      responseSchema: schema,
      requestSchema: schema,
    });
    expect(def.path).toBe('status/');
    expect(def).not.toHaveProperty('trailingSlash');
    expect(def.responseSchema).toBe(schema);
  });

  it('builds status and market exactly as they were written before derivation', () => {
    const shape = (
      map: Record<
        string,
        { method: string; path: string; requiresAuth: boolean }
      >,
    ) =>
      Object.fromEntries(
        Object.entries(map).map(([name, d]) => [
          name,
          `${d.method} ${d.path} ${d.requiresAuth ? 'auth' : 'public'}`,
        ]),
      );
    expect(shape(statusEndpoints)).toEqual({ getStatus: 'GET status public' });
    expect(shape(marketEndpoints)).toEqual({
      getCharacterOrders: 'GET characters/{characterId}/orders/ auth',
      getCharacterOrderHistory:
        'GET characters/{characterId}/orders/history/ auth',
      getCorporationOrders: 'GET corporations/{corporationId}/orders/ auth',
      getCorporationOrderHistory:
        'GET corporations/{corporationId}/orders/history/ auth',
      getMarketGroups: 'GET markets/groups/ public',
      getMarketGroupInformation: 'GET markets/groups/{marketGroupId}/ public',
      getMarketPrices: 'GET markets/prices/ public',
      getMarketOrdersInStructure: 'GET markets/structures/{structureId}/ auth',
      getMarketHistory: 'GET markets/{regionId}/history/ public',
      getMarketOrders: 'GET markets/{regionId}/orders/ public',
      getMarketTypes: 'GET markets/{regionId}/types/ public',
    });
  });
});
