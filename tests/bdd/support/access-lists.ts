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
  /** One entry per entity granularity, both access types present. */
  mixedEntries: () => [
    {
      entity_id: 1689391488,
      entity_type: 'character',
      access_type: 'allowed',
    },
    {
      entity_id: 98000002,
      entity_type: 'corporation',
      access_type: 'allowed',
    },
    {
      entity_id: 99000001,
      entity_type: 'alliance',
      access_type: 'blocked',
    },
  ],

  mixedList: () => ({
    access_list_id: MIXED_ACCESS_LIST_ID,
    name: 'Station Docking ACL',
    entries: accessListFixtures.mixedEntries(),
  }),

  emptyList: () => ({
    access_list_id: EMPTY_ACCESS_LIST_ID,
    name: 'Empty ACL',
    entries: [],
  }),
};
