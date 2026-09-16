/**
 * What ESI's war endpoints send back in 0038-wars.feature, and where.
 * Step files queue these; they do not build payloads or URLs themselves.
 */

export const ACTIVE_WAR_ID = 700001;
export const FINISHED_WAR_ID = 700002;
export const MUTUAL_WAR_ID = 700003;
export const EMPTY_WAR_ID = 700004;
export const UNKNOWN_WAR_ID = 999999999;

/**
 * Match a URL whose path ends exactly at `path`, so `/wars/700001` does not
 * also serve `/wars/700001/killmails`.
 */
function exactPath(path: string): RegExp {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^https://esi\\.evetech\\.net${escaped}(\\?|$)`);
}

export const warPaths = {
  list: '/wars',
  war: (warId: number) => `/wars/${warId}`,
  killmails: (warId: number) => `/wars/${warId}/killmails`,
};

/** URL matchers pinned to the end of each path. */
export const warMatches = {
  list: () => exactPath(warPaths.list),
  war: (warId: number) => exactPath(warPaths.war(warId)),
  killmails: (warId: number) => exactPath(warPaths.killmails(warId)),
};

export const warFixtures = {
  warIds: () => [700005, 700004, 700003, 700002, 700001],

  descendingWarIds: () => [700010, 700009, 700008, 700007, 700006],

  activeAggressor: () => ({
    alliance_id: 99005338,
    isk_destroyed: 150000000000.0,
    ships_killed: 250,
  }),

  activeDefender: () => ({
    alliance_id: 99000001,
    isk_destroyed: 75000000000.0,
    ships_killed: 120,
  }),

  /** ESI omits `finished` on a war that is still running. */
  activeWar: () => ({
    id: ACTIVE_WAR_ID,
    aggressor: warFixtures.activeAggressor(),
    defender: warFixtures.activeDefender(),
    declared: '2024-01-10T00:00:00Z',
    started: '2024-01-11T00:00:00Z',
    mutual: false,
    open_for_allies: true,
  }),

  finishedWar: () => ({
    id: FINISHED_WAR_ID,
    aggressor: {
      alliance_id: 99005338,
      isk_destroyed: 500000000000.0,
      ships_killed: 800,
    },
    defender: {
      alliance_id: 99000002,
      isk_destroyed: 300000000000.0,
      ships_killed: 450,
    },
    declared: '2023-12-01T00:00:00Z',
    started: '2023-12-02T00:00:00Z',
    finished: '2024-01-01T00:00:00Z',
    mutual: false,
    open_for_allies: false,
  }),

  mutualWar: () => ({
    id: MUTUAL_WAR_ID,
    aggressor: {
      alliance_id: 99005338,
      isk_destroyed: 200000000000.0,
      ships_killed: 350,
    },
    defender: {
      alliance_id: 99000003,
      isk_destroyed: 180000000000.0,
      ships_killed: 320,
    },
    declared: '2024-01-05T00:00:00Z',
    started: '2024-01-06T00:00:00Z',
    mutual: true,
    open_for_allies: false,
  }),

  /** An active war whose aggressor outscores the defender on both counts. */
  lopsidedWar: () => ({
    id: ACTIVE_WAR_ID,
    aggressor: {
      alliance_id: 99005338,
      isk_destroyed: 500000000000.0,
      ships_killed: 800,
    },
    defender: {
      alliance_id: 99000001,
      isk_destroyed: 200000000000.0,
      ships_killed: 300,
    },
    declared: '2024-01-10T00:00:00Z',
    started: '2024-01-11T00:00:00Z',
    mutual: false,
    open_for_allies: true,
  }),

  threeKillmails: () => [
    { killmail_id: 90000001, killmail_hash: 'abc123def456' },
    { killmail_id: 90000002, killmail_hash: 'ghi789jkl012' },
    { killmail_id: 90000003, killmail_hash: 'mno345pqr678' },
  ],

  twoKillmails: () => [
    { killmail_id: 90000001, killmail_hash: 'abc123' },
    { killmail_id: 90000002, killmail_hash: 'def456' },
  ],
};
