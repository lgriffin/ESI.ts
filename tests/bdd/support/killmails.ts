/**
 * What ESI's killmail endpoints send back in 0019-killmails.feature, and
 * where. Step files queue these; they do not build payloads or URLs themselves.
 */

export const PILOT_CHARACTER_ID = 1689391488;
export const QUIET_CHARACTER_ID = 111111111;
export const CORPORATION_ID = 1344654522;

export const REPORT_KILLMAIL = { id: 100001, hash: 'abc123def456' };
export const MISMATCHED_KILLMAIL = { id: 100001, hash: 'invalid_hash_value' };
export const CHAINED_KILLMAIL = { id: 300001, hash: 'chain_hash_001' };
export const MULTI_ATTACKER_KILLMAIL = {
  id: 400001,
  hash: '8f3b2c1d4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c',
};

export const killmailPaths = {
  characterRecent: (characterId: number) =>
    `/characters/${characterId}/killmails/recent`,
  corporationRecent: (corporationId: number) =>
    `/corporations/${corporationId}/killmails/recent`,
  detail: (killmail: { id: number; hash: string }) =>
    `/killmails/${killmail.id}/${killmail.hash}`,
};

export const killmailFixtures = {
  characterSummaries: () => [
    { killmail_id: 100001, killmail_hash: 'abc123def456' },
    { killmail_id: 100002, killmail_hash: 'ghi789jkl012' },
    { killmail_id: 100003, killmail_hash: 'mno345pqr678' },
  ],

  corporationSummaries: () => [
    { killmail_id: 200001, killmail_hash: 'corp_hash_aaa' },
    { killmail_id: 200002, killmail_hash: 'corp_hash_bbb' },
    { killmail_id: 200003, killmail_hash: 'corp_hash_ccc' },
    { killmail_id: 200004, killmail_hash: 'corp_hash_ddd' },
    { killmail_id: 200005, killmail_hash: 'corp_hash_eee' },
  ],

  reportVictim: () => ({
    ship_type_id: 587,
    character_id: 987654321,
    corporation_id: 1344654522,
    damage_taken: 8200,
    position: { x: 1.0e12, y: -2.5e10, z: 3.3e11 },
    items: [
      {
        item_type_id: 3170,
        quantity_destroyed: 1,
        flag: 11,
        singleton: 0,
      },
    ],
  }),

  reportAttackers: () => [
    {
      character_id: 1689391488,
      corporation_id: 98000001,
      ship_type_id: 24690,
      weapon_type_id: 2929,
      damage_done: 5000,
      final_blow: true,
      security_status: 5.0,
    },
    {
      character_id: 123456789,
      corporation_id: 98000002,
      ship_type_id: 17918,
      weapon_type_id: 2961,
      damage_done: 3200,
      final_blow: false,
      security_status: 3.2,
    },
  ],

  report: () => ({
    killmail_id: REPORT_KILLMAIL.id,
    killmail_time: '2024-01-15T12:30:00Z',
    solar_system_id: 30000142,
    victim: killmailFixtures.reportVictim(),
    attackers: killmailFixtures.reportAttackers(),
  }),

  chainSummaries: () => [
    { killmail_id: 300001, killmail_hash: 'chain_hash_001' },
    { killmail_id: 300002, killmail_hash: 'chain_hash_002' },
  ],

  chainedDetail: () => ({
    killmail_id: CHAINED_KILLMAIL.id,
    killmail_time: '2024-01-15T14:00:00Z',
    solar_system_id: 30002187,
    victim: {
      ship_type_id: 11393,
      character_id: 555555555,
      corporation_id: 666666666,
      damage_taken: 12500,
      items: [],
    },
    attackers: [
      {
        character_id: 1689391488,
        ship_type_id: 17918,
        damage_done: 12500,
        final_blow: true,
        security_status: 5.0,
      },
    ],
  }),

  /** Three attackers; the final blow is held by the lowest-damage pilot. */
  multiAttackerDetail: () => ({
    killmail_id: MULTI_ATTACKER_KILLMAIL.id,
    killmail_time: '2024-02-01T08:00:00Z',
    solar_system_id: 30000142,
    victim: {
      ship_type_id: 645,
      character_id: 333333333,
      corporation_id: 444444444,
      damage_taken: 15600,
      items: [],
    },
    attackers: [
      {
        character_id: 1689391488,
        ship_type_id: 24690,
        damage_done: 8000,
        final_blow: false,
        security_status: 5.0,
      },
      {
        character_id: 123456789,
        ship_type_id: 17918,
        damage_done: 5500,
        final_blow: false,
        security_status: 3.2,
      },
      {
        character_id: 111111111,
        ship_type_id: 587,
        damage_done: 2100,
        final_blow: true,
        security_status: 1.5,
      },
    ],
  }),
};
