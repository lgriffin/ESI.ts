// Excerpt of src/core/endpoints/MarketEndpoints.ts (fixture).
// getMarketTypes was just wired in; no EARS requirement covers it yet.

export const marketEndpoints = {
  getMarketOrders: {
    path: 'markets/{regionId}/orders/',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['regionId'],
    queryParams: { orderType: 'order_type' },
    responseSchema: z.array(MarketOrderSchema),
  },
  getMarketTypes: {
    path: 'markets/{regionId}/types/',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['regionId'],
    responseSchema: z.array(z.number()),
  },
} as const satisfies EndpointMap;

// From src/core/endpoints/esi-cache-ttls.generated.ts:
//   'GET:markets/{region_id}/types': 600,
