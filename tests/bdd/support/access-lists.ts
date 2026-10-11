/**
 * What ESI's access list endpoint sends back in 0039-access-lists.feature,
 * and where. Step files queue these; they do not build payloads or URLs
 * themselves.
 */

export const ACCESS_LIST_OWNER_ID = 1689391488;
export const MIXED_ACCESS_LIST_ID = 42;
export const EMPTY_ACCESS_LIST_ID = 99;
export const UNKNOWN_ACCESS_LIST_ID = 999999;

/** A token ESI no longer accepts. */
export const EXPIRED_ACCESS_TOKEN = 'expired-access-token';

export const accessListPaths = {
  list: (characterId: number, accessListId: number) =>
    `/characters/${characterId}/access-lists/${accessListId}`,
};

export const accessListFixtures = {
  /** One member per entity kind, with several access levels present. */
  mixedMembership: () => ({
    allow_everyone: false,
    alliances: [{ alliance_id: 99000001, access: 'Blocked' }],
    corporations: [{ corporation_id: 98000002, access: 'Allowed' }],
    characters: [{ character_id: 1689391488, access: 'Admin' }],
  }),

  mixedList: () => ({
    id: MIXED_ACCESS_LIST_ID,
    name: 'Station Docking ACL',
    description: 'Who may dock at the staging Fortizar',
    membership: accessListFixtures.mixedMembership(),
  }),

  emptyList: () => ({
    id: EMPTY_ACCESS_LIST_ID,
    name: 'Empty ACL',
    description: '',
    membership: {
      allow_everyone: false,
      alliances: [],
      corporations: [],
      characters: [],
    },
  }),
};
