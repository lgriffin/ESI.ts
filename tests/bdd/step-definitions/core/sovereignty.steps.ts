import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import {
  RETRYABLE_ATTEMPTS,
  createSeamClient,
  lastRequest,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature('tests/bdd/features/core/0033-sovereignty.feature');

const CAMPAIGNS_PATH = '/sovereignty/campaigns';
const SYSTEMS_PATH = '/sovereignty/systems';

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Active contests return event type and both contest scores', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const campaigns = [
      {
        campaign_id: 1001,
        event_type: 'tcu_defense',
        solar_system_id: 30004759,
        constellation_id: 20000690,
        start_time: '2024-03-15T18:00:00Z',
        structure_id: 8001,
        attackers_score: 0.4,
        defender_score: 0.6,
        defender_id: 99005338,
      },
      {
        campaign_id: 1002,
        event_type: 'ihub_defense',
        solar_system_id: 30004760,
        constellation_id: 20000690,
        start_time: '2024-03-15T19:00:00Z',
        structure_id: 8002,
        attackers_score: 0.7,
        defender_score: 0.3,
        defender_id: 99000001,
      },
    ];

    given('active sovereignty contests exist', () => {
      queueResponse({ match: CAMPAIGNS_PATH, body: campaigns });
    });

    when('the client requests campaigns', async () => {
      result = await client.sovereignty.getSovereigntyCampaigns();
    });

    then('the client shall return campaign details with scores', () => {
      expect(sentRequests()).toHaveLength(1);
      const request = lastRequest();
      expect(request.method).toBe('GET');
      expect(request.url.pathname).toMatch(/\/sovereignty\/campaigns\/?$/);

      expect(result).toEqual(campaigns);
      expect(
        result.map((c: any) => [
          c.campaign_id,
          c.event_type,
          c.structure_id,
          c.attackers_score,
          c.defender_score,
        ]),
      ).toEqual([
        [1001, 'tcu_defense', 8001, 0.4, 0.6],
        [1002, 'ihub_defense', 8002, 0.7, 0.3],
      ]);
      expect(result[1].defender_id).toBe(99000001);
    });
  });

  test('Cluster with no contests returns an empty campaign array', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('no active campaigns exist', () => {
      queueResponse({ match: CAMPAIGNS_PATH, body: [] });
    });

    when('the client requests campaigns', async () => {
      result = await client.sovereignty.getSovereigntyCampaigns();
    });

    then('the client shall return an empty array', () => {
      expect(sentRequests()).toHaveLength(1);
      expect(lastRequest().url.pathname).toMatch(
        /\/sovereignty\/campaigns\/?$/,
      );
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });
  });

  test('ESI outage rejects the campaign request with an EsiError', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('the ESI service is down', () => {
      // 503 is retryable, so the outage has to outlast the retry budget.
      queueError(503, 'Service Unavailable', {
        match: CAMPAIGNS_PATH,
        times: RETRYABLE_ATTEMPTS,
      });
    });

    when('the client requests sovereignty data', async () => {
      try {
        await client.sovereignty.getSovereigntyCampaigns();
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a 503 error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(503);
      expect(sentRequests()).toHaveLength(RETRYABLE_ATTEMPTS);
    });
  });

  test('Two claimed systems return separate military, industrial, and strategic levels', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const systems = {
      solar_systems: [
        {
          solar_system_id: 30000142,
          claim: {
            alliance: {
              alliance_id: 99005338,
              corporation_id: 1344654522,
              claimed_since: '2020-10-08T00:38:16Z',
              is_capital_system: false,
              development: {
                activity_defense_multiplier: 4.5,
                military_level: 5,
                industrial_level: 3,
                strategic_level: 1,
              },
            },
          },
        },
        {
          solar_system_id: 30004759,
          claim: {
            alliance: {
              alliance_id: 99000001,
              corporation_id: 987654321,
              claimed_since: '2021-01-01T00:00:00Z',
              is_capital_system: false,
              development: {
                activity_defense_multiplier: 3.0,
                military_level: 2,
                industrial_level: 4,
                strategic_level: 3,
              },
            },
          },
        },
      ],
    };

    given('the combined systems endpoint is available', () => {
      queueResponse({ match: SYSTEMS_PATH, body: systems });
    });

    when('the client requests sovereignty systems', async () => {
      result = await client.sovereignty.getSovereigntySystems();
    });

    then(
      'the client shall return occupancy, structures, and separate ADM indices',
      () => {
        expect(sentRequests()).toHaveLength(1);
        const request = lastRequest();
        expect(request.method).toBe('GET');
        expect(request.url.pathname).toMatch(/\/sovereignty\/systems\/?$/);

        expect(result).toEqual(systems);
        expect(
          result.solar_systems.map((s: any) => [
            s.solar_system_id,
            s.claim.alliance.alliance_id,
            s.claim.alliance.corporation_id,
            s.claim.alliance.claimed_since,
            s.claim.alliance.development.military_level,
            s.claim.alliance.development.industrial_level,
            s.claim.alliance.development.strategic_level,
          ]),
        ).toEqual([
          [30000142, 99005338, 1344654522, '2020-10-08T00:38:16Z', 5, 3, 1],
          [30004759, 99000001, 987654321, '2021-01-01T00:00:00Z', 2, 4, 3],
        ]);
      },
    );
  });

  test('Combined payload carries claim, development, and hub vulnerability window together', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('the combined systems endpoint exists', () => {
      queueResponse({
        match: SYSTEMS_PATH,
        body: {
          solar_systems: [
            {
              solar_system_id: 30000142,
              claim: {
                alliance: {
                  alliance_id: 99005338,
                  corporation_id: 1344654522,
                  claimed_since: '2020-10-08T00:38:16Z',
                  sovereignty_hub: {
                    id: 1034510825648,
                    vulnerability_window: {
                      start: '2026-05-20T17:00:00Z',
                      end: '2026-05-20T20:00:00Z',
                    },
                  },
                  is_capital_system: false,
                  development: {
                    activity_defense_multiplier: 4.5,
                    military_level: 5,
                    industrial_level: 3,
                    strategic_level: 1,
                  },
                },
              },
            },
          ],
        },
      });
    });

    when('the client fetches systems', async () => {
      result = await client.sovereignty.getSovereigntySystems();
    });

    then('it shall contain data from both map and structures', () => {
      expect(sentRequests()).toHaveLength(1);
      expect(result.solar_systems).toHaveLength(1);
      const sys = result.solar_systems[0];
      expect(sys.solar_system_id).toBe(30000142);
      expect(sys.claim.alliance.alliance_id).toBe(99005338);
      expect(sys.claim.alliance.development).toEqual({
        activity_defense_multiplier: 4.5,
        military_level: 5,
        industrial_level: 3,
        strategic_level: 1,
      });
      expect(sys.claim.alliance.sovereignty_hub).toEqual({
        id: 1034510825648,
        vulnerability_window: {
          start: '2026-05-20T17:00:00Z',
          end: '2026-05-20T20:00:00Z',
        },
      });
    });
  });

  test('Concurrent campaign and system calls resolve to joinable payloads', ({
    given,
    when,
    then,
  }) => {
    let campaigns: any;
    let systems: any;

    given('all sovereignty endpoints are available', () => {
      // Each response is pinned to its own path, and the systems response is
      // held back so the campaign call resolves while it is still in flight.
      queueResponse({
        match: SYSTEMS_PATH,
        delayMs: 20,
        body: {
          solar_systems: [
            {
              solar_system_id: 30004759,
              claim: {
                alliance: {
                  alliance_id: 99005338,
                  corporation_id: 1344654522,
                  claimed_since: '2020-10-08T00:38:16Z',
                  is_capital_system: false,
                  development: {
                    activity_defense_multiplier: 4.5,
                    military_level: 5,
                    industrial_level: 3,
                    strategic_level: 1,
                  },
                },
              },
            },
          ],
        },
      });
      queueResponse({
        match: CAMPAIGNS_PATH,
        body: [
          {
            campaign_id: 1001,
            event_type: 'tcu_defense',
            solar_system_id: 30004759,
            constellation_id: 20000690,
            start_time: '2024-03-15T18:00:00Z',
            structure_id: 8001,
            attackers_score: 0.5,
            defender_score: 0.5,
            defender_id: 99005338,
          },
        ],
      });
    });

    when('the client fetches all data concurrently', async () => {
      [campaigns, systems] = await Promise.all([
        client.sovereignty.getSovereigntyCampaigns(),
        client.sovereignty.getSovereigntySystems(),
      ]);
    });

    then('both shall return valid data', () => {
      const paths = sentRequests().map((r) => r.url.pathname);
      expect(paths).toHaveLength(2);
      expect(paths.some((p) => /\/sovereignty\/campaigns\/?$/.test(p))).toBe(
        true,
      );
      expect(paths.some((p) => /\/sovereignty\/systems\/?$/.test(p))).toBe(
        true,
      );

      expect(Array.isArray(campaigns)).toBe(true);
      expect(campaigns).toHaveLength(1);
      expect(campaigns[0].campaign_id).toBe(1001);
      expect(systems.solar_systems).toHaveLength(1);
      expect(systems.solar_systems[0].solar_system_id).toBe(30004759);

      // Cross-reference: campaign and system in same solar system
      expect(campaigns[0].solar_system_id).toBe(
        systems.solar_systems[0].solar_system_id,
      );
      expect(campaigns[0].defender_id).toBe(
        systems.solar_systems[0].claim.alliance.alliance_id,
      );
    });
  });
});
