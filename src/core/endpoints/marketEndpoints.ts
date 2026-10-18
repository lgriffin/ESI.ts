import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  MarketOrderSchema,
  CharacterMarketOrderSchema,
  CharacterMarketOrderHistorySchema,
  CorporationMarketOrderSchema,
  CorporationMarketOrderHistorySchema,
  StructureMarketOrderSchema,
  MarketHistorySchema,
  MarketGroupSchema,
  MarketPriceSchema,
} from '../../schemas/market';

export const marketEndpoints = {
  getCharacterOrders: fromOperation('GetCharactersCharacterIdOrders', {
    trailingSlash: true,
    pathParams: ['characterId'],
    responseSchema: z.array(CharacterMarketOrderSchema),
  }),
  getCharacterOrderHistory: fromOperation(
    'GetCharactersCharacterIdOrdersHistory',
    {
      trailingSlash: true,
      pathParams: ['characterId'],
      responseSchema: z.array(CharacterMarketOrderHistorySchema),
    },
  ),
  getCorporationOrders: fromOperation('GetCorporationsCorporationIdOrders', {
    trailingSlash: true,
    pathParams: ['corporationId'],
    responseSchema: z.array(CorporationMarketOrderSchema),
  }),
  getCorporationOrderHistory: fromOperation(
    'GetCorporationsCorporationIdOrdersHistory',
    {
      trailingSlash: true,
      pathParams: ['corporationId'],
      responseSchema: z.array(CorporationMarketOrderHistorySchema),
    },
  ),
  getMarketGroups: fromOperation('GetMarketsGroups', {
    trailingSlash: true,
    responseSchema: z.array(z.number()),
  }),
  getMarketGroupInformation: fromOperation('GetMarketsGroupsMarketGroupId', {
    trailingSlash: true,
    pathParams: ['marketGroupId'],
    responseSchema: MarketGroupSchema,
  }),
  getMarketPrices: fromOperation('GetMarketsPrices', {
    trailingSlash: true,
    responseSchema: z.array(MarketPriceSchema),
  }),
  getMarketOrdersInStructure: fromOperation('GetMarketsStructuresStructureId', {
    trailingSlash: true,
    pathParams: ['structureId'],
    responseSchema: z.array(StructureMarketOrderSchema),
  }),
  getMarketHistory: fromOperation('GetMarketsRegionIdHistory', {
    trailingSlash: true,
    pathParams: ['regionId'],
    queryParams: { typeId: 'type_id' },
    responseSchema: z.array(MarketHistorySchema),
  }),
  getMarketOrders: fromOperation('GetMarketsRegionIdOrders', {
    trailingSlash: true,
    pathParams: ['regionId'],
    queryParams: { orderType: 'order_type' },
    responseSchema: z.array(MarketOrderSchema),
  }),
  getMarketTypes: fromOperation('GetMarketsRegionIdTypes', {
    trailingSlash: true,
    pathParams: ['regionId'],
    responseSchema: z.array(z.number()),
  }),
} as const satisfies EndpointMap;
