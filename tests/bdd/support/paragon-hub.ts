/**
 * What ESI's Paragon Hub endpoints send back in 0027-paragon-hub.feature, and
 * where. Step files queue these; they do not build payloads or URLs
 * themselves.
 */

export const LISTING_CHARACTER_ID = 123456;
export const TARGETED_ALLIANCE_ID = 99000006;
export const PAGE_TWO_CURSOR = 'cursor-page2';

export const paragonHubPaths = {
  publicListings: '/paragon-hub/skinr',
  characterListings: (characterId: number) =>
    `/characters/${characterId}/paragon-hub/skinr`,
  allianceListings: (allianceId: number) =>
    `/paragon-hub/skinr/alliances/${allianceId}`,
  afterCursor: (cursor: string) => `after=${cursor}`,
};

export const paragonHubFixtures = {
  /** The public board: one ISK-priced and one PLEX-priced listing, with a cursor. */
  publicListings: () => ({
    cursor: { after: 'cursor-abc', before: 'cursor-xyz' },
    listings: [
      {
        id: '3868eaed-8278-4cb7-9709-7d7de9c20dc7',
        state: 'listed',
        last_modified: '2026-08-18T10:00:00Z',
        seller_id: 90000001,
        skinr_id: 'skinr-design-001',
        created: '2026-08-17T08:00:00Z',
        expires: '2026-09-17T08:00:00Z',
        quantity: 5,
        price: { isk: 500000000 },
      },
      {
        id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
        state: 'listed',
        last_modified: '2026-08-18T11:00:00Z',
        seller_id: 90000002,
        skinr_id: 'skinr-design-002',
        created: '2026-08-16T14:00:00Z',
        expires: '2026-09-16T14:00:00Z',
        quantity: 1,
        price: { plex: 100 },
      },
    ],
  }),

  /** One listing posted by `LISTING_CHARACTER_ID`, on the public board. */
  characterListings: () => ({
    cursor: { after: 'cursor-char-abc' },
    listings: [
      {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        state: 'listed',
        last_modified: '2026-08-18T10:00:00Z',
        seller_id: LISTING_CHARACTER_ID,
        skinr_id: 'skinr-design-003',
        created: '2026-08-15T12:00:00Z',
        expires: '2026-09-15T12:00:00Z',
        quantity: 10,
        price: { isk: 250000000 },
        target: { public: true },
      },
    ],
  }),

  /** One listing targeted at `TARGETED_ALLIANCE_ID`, with no cursor. */
  allianceListings: () => ({
    listings: [
      {
        id: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
        state: 'listed',
        last_modified: '2026-08-18T12:00:00Z',
        seller_id: 90000003,
        skinr_id: 'skinr-design-004',
        created: '2026-08-14T10:00:00Z',
        expires: '2026-09-14T10:00:00Z',
        quantity: 3,
        price: { isk: 750000000 },
      },
    ],
  }),

  /** The page `PAGE_TWO_CURSOR` identifies, with both adjacent cursors. */
  pageTwo: () => ({
    cursor: { after: 'cursor-page3', before: 'cursor-page1' },
    listings: [
      {
        id: 'd4e5f6a7-b8c9-0123-def0-456789012345',
        state: 'listed',
        last_modified: '2026-08-18T14:00:00Z',
        seller_id: 90000004,
        skinr_id: 'skinr-design-005',
        created: '2026-08-13T09:00:00Z',
        expires: '2026-09-13T09:00:00Z',
        quantity: 2,
        price: { plex: 50 },
      },
    ],
  }),
};
