/**
 * The Paragon Hub schemas of `./schemas`: each accepts a valid body, rejects
 * a wrong type and keeps an unknown field (z.looseObject).
 */
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import {
  ParagonHubCharacterListingSchema,
  ParagonHubCharacterSkinrResponseSchema,
  ParagonHubCursorSchema,
  ParagonHubSkinrListingSchema,
  ParagonHubSkinrPriceSchema,
  ParagonHubSkinrResponseSchema,
  ParagonHubSkinrTargetSchema,
} from '../../../src/schemas';

interface SchemaTestCase {
  name: string;
  schema: z.ZodType;
  validData: Record<string, unknown>;
  invalidData: Record<string, unknown>;
}

const cursor = {
  before: '1.MTc5MDQ3OTAzMjM0OS0w',
  after: '1.MTc5MDQ4MTc4NjAyOS0w',
};
const price = { isk: 250000000 };
const target = { corporation_id: 98000002 };
const listing = {
  id: '574dfcae-2e19-4f60-93c9-2fa844e83963',
  state: 'listed',
  last_modified: '2026-09-27T03:17:12Z',
  seller_id: 2119597578,
  skinr_id: '5ad758a15e0bdfe1dff831b138068f4fabacb28ad94a7527073b818b566383fd',
  created: '2026-09-20T03:17:12Z',
  expires: '2026-10-20T03:17:12Z',
  quantity: 5,
  price,
};
const characterListing = { ...listing, target };

const schemaCases: SchemaTestCase[] = [
  {
    name: 'ParagonHubCursorSchema',
    schema: ParagonHubCursorSchema,
    validData: cursor,
    invalidData: { after: 42 },
  },
  {
    name: 'ParagonHubSkinrPriceSchema',
    schema: ParagonHubSkinrPriceSchema,
    validData: price,
    invalidData: { plex: '500' },
  },
  {
    name: 'ParagonHubSkinrTargetSchema',
    schema: ParagonHubSkinrTargetSchema,
    validData: target,
    invalidData: { public: 'yes' },
  },
  {
    name: 'ParagonHubSkinrListingSchema',
    schema: ParagonHubSkinrListingSchema,
    validData: listing,
    invalidData: { ...listing, quantity: 'five' },
  },
  {
    name: 'ParagonHubCharacterListingSchema',
    schema: ParagonHubCharacterListingSchema,
    validData: characterListing,
    invalidData: { ...characterListing, seller_id: '2119597578' },
  },
  {
    name: 'ParagonHubSkinrResponseSchema',
    schema: ParagonHubSkinrResponseSchema,
    validData: { cursor, listings: [listing] },
    invalidData: { cursor, listings: [{ ...listing, price: 'free' }] },
  },
  {
    name: 'ParagonHubCharacterSkinrResponseSchema',
    schema: ParagonHubCharacterSkinrResponseSchema,
    validData: { listings: [characterListing] },
    invalidData: { listings: [{ ...characterListing, target: 'public' }] },
  },
];

describe('Paragon Hub schemas', () => {
  describe.each(schemaCases)('$name', ({ schema, validData, invalidData }) => {
    it('accepts a valid body', () => {
      expect(schema.safeParse(validData).success).toBe(true);
    });

    it('rejects a wrong type on a field', () => {
      expect(schema.safeParse(invalidData).success).toBe(false);
    });

    it('keeps an unknown field', () => {
      const result = schema.safeParse({ ...validData, _extra_field: 'kept' });
      expect(result.success).toBe(true);
      expect(
        (result.data as Record<string, unknown> | undefined)?._extra_field,
      ).toBe('kept');
    });
  });

  it('ParagonHubSkinrResponseSchema accepts the recorded GET /paragon-hub/skinr body', () => {
    const fixture = JSON.parse(
      fs.readFileSync(
        path.resolve(
          __dirname,
          '../../contract/fixtures/recorded/paragonHub.getPublicListings.json',
        ),
        'utf8',
      ),
    ) as { pages: { body: unknown }[] };
    expect(
      ParagonHubSkinrResponseSchema.safeParse(fixture.pages[0]!.body).success,
    ).toBe(true);
  });
});
