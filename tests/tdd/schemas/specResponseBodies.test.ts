/**
 * Response bodies shaped exactly as the ESI OpenAPI spec defines them
 * (compatibility_date 2025-12-16) pass the Zod schema the client validates
 * that route with. A schema that requires a field the spec does not define,
 * or expects a different shape, throws EsiValidationError on every real
 * response.
 *
 * Each body carries only what the spec defines for the route, with the
 * optional fields ESI sends in practice.
 */
import { z } from 'zod';
import { contractEndpoints } from '../../../src/core/endpoints/contractEndpoints';

interface BodyCase {
  route: string;
  schema: z.ZodType;
  body: unknown;
}

const cases: BodyCase[] = [
  {
    // ContractsPublicBidsContractIdGet: no bidder_id on a public bid.
    route: 'GET /contracts/public/bids/{contract_id}',
    schema: contractEndpoints.getPublicContractBids.responseSchema,
    body: [{ bid_id: 1, date_bid: '2026-09-15T10:00:00Z', amount: 12000000 }],
  },
  {
    // ContractsPublicItemsContractIdGet: no is_singleton or raw_quantity; a
    // blueprint line carries item_id, efficiency and runs.
    route: 'GET /contracts/public/items/{contract_id}',
    schema: contractEndpoints.getPublicContractItems.responseSchema,
    body: [
      { record_id: 1, type_id: 34, quantity: 1000000, is_included: true },
      {
        record_id: 2,
        type_id: 691,
        quantity: 1,
        is_included: true,
        item_id: 1040011111111,
        is_blueprint_copy: true,
        material_efficiency: 10,
        time_efficiency: 20,
        runs: 5,
      },
    ],
  },
];

describe('Schemas accept response bodies shaped as the ESI spec defines', () => {
  it.each(cases)('$route', ({ schema, body }) => {
    const result = schema.safeParse(body);
    expect(result.success ? [] : result.error.issues).toEqual([]);
  });
});
