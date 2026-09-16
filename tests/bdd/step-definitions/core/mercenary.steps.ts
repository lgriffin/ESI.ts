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

const feature = loadFeature('tests/bdd/features/core/0024-mercenary.feature');

const TEST_CHARACTER_ID = 123456;

// List endpoints end at the collection; detail endpoints add an ID segment.
const DENS_LIST = new RegExp(
  `/characters/${TEST_CHARACTER_ID}/structures/mercenary-dens/?(\\?.*)?$`,
);
const OPS_LIST = new RegExp(
  `/characters/${TEST_CHARACTER_ID}/mercenary-tactical-operations/?(\\?.*)?$`,
);

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Two dens return their development, anarchy, and active operation counts', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedDens = [
      {
        den_id: 5001,
        system_id: 30000142,
        constellation_id: 20000125,
        region_id: 10000002,
        development_level: 3,
        anarchy_level: 2,
        active_operations: 1,
      },
      {
        den_id: 5002,
        system_id: 30004759,
        constellation_id: 20000690,
        region_id: 10000060,
        development_level: 5,
        anarchy_level: 4,
        active_operations: 3,
      },
    ];

    given('mercenary dens exist', () => {
      queueResponse({ match: DENS_LIST, body: expectedDens });
    });

    when('the client requests dens', async () => {
      result = await client.mercenary.getMercenaryDens(TEST_CHARACTER_ID);
    });

    then('the client shall return development and anarchy parameters', () => {
      const request = lastRequest();
      expect(request.method).toBe('GET');
      expect(request.url.pathname).toMatch(
        new RegExp(
          `/characters/${TEST_CHARACTER_ID}/structures/mercenary-dens/?$`,
        ),
      );
      expect(request.headers['authorization']).toBe('Bearer bdd-access-token');
      expect(
        result.map((d: any) => [
          d.den_id,
          d.development_level,
          d.anarchy_level,
          d.active_operations,
        ]),
      ).toEqual([
        [5001, 3, 2, 1],
        [5002, 5, 4, 3],
      ]);
    });
  });

  test('Character with no dens receives an empty array', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('no dens exist in the area', () => {
      queueResponse({ match: DENS_LIST, body: [] });
    });

    when('the client requests dens', async () => {
      result = await client.mercenary.getMercenaryDens(TEST_CHARACTER_ID);
    });

    then('the client shall return an empty array', () => {
      expect(sentRequests()).toHaveLength(1);
      expect(result).toEqual([]);
    });
  });

  test('Active and spawning operations return their site type and status', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedOps = [
      {
        operation_id: 7001,
        den_id: 5001,
        system_id: 30000142,
        site_type: 'assault',
        status: 'active',
        started_at: '2026-05-20T10:00:00Z',
        expires_at: '2026-05-20T22:00:00Z',
      },
      {
        operation_id: 7002,
        den_id: 5002,
        system_id: 30004759,
        site_type: 'recon',
        status: 'spawning',
        started_at: '2026-05-20T14:00:00Z',
        expires_at: '2026-05-21T02:00:00Z',
      },
    ];

    given('MTOs are active', () => {
      queueResponse({ match: OPS_LIST, body: expectedOps });
    });

    when('the client requests operations', async () => {
      result =
        await client.mercenary.getMercenaryTacticalOperations(
          TEST_CHARACTER_ID,
        );
    });

    then('the client shall return operation details with status', () => {
      expect(lastRequest().url.pathname).toMatch(
        new RegExp(
          `/characters/${TEST_CHARACTER_ID}/mercenary-tactical-operations/?$`,
        ),
      );
      expect(
        result.map((op: any) => [op.operation_id, op.site_type, op.status]),
      ).toEqual([
        [7001, 'assault', 'active'],
        [7002, 'recon', 'spawning'],
      ]);
    });
  });

  test('Operation den_id matches the parent den fetched alongside it', ({
    given,
    when,
    then,
  }) => {
    let denResults: any;
    let opResults: any;

    given('dens and MTOs exist', () => {
      queueResponse({
        match: DENS_LIST,
        body: [
          {
            den_id: 5001,
            system_id: 30000142,
            constellation_id: 20000125,
            region_id: 10000002,
            development_level: 3,
            anarchy_level: 2,
            active_operations: 1,
          },
        ],
      });
      queueResponse({
        match: OPS_LIST,
        body: [
          {
            operation_id: 7001,
            den_id: 5001,
            system_id: 30000142,
            site_type: 'assault',
            status: 'active',
            started_at: '2026-05-20T10:00:00Z',
            expires_at: '2026-05-20T22:00:00Z',
          },
        ],
      });
    });

    when('the client fetches both', async () => {
      [denResults, opResults] = await Promise.all([
        client.mercenary.getMercenaryDens(TEST_CHARACTER_ID),
        client.mercenary.getMercenaryTacticalOperations(TEST_CHARACTER_ID),
      ]);
    });

    then('the client shall correlate operations to their parent dens', () => {
      expect(sentRequests()).toHaveLength(2);
      expect(denResults.map((d: any) => d.den_id)).toEqual([5001]);
      expect(opResults.map((op: any) => op.operation_id)).toEqual([7001]);
      expect(opResults[0].den_id).toBe(5001);
      expect(opResults[0].den_id).toBe(denResults[0].den_id);
    });
  });

  test('Running den reports its evolution levels, infomorphs, and skyhook', ({
    given,
    when,
    then,
  }) => {
    const denId = 5001;
    let result: any;

    given('a mercenary den exists with detail data', () => {
      queueResponse({
        match: `/structures/mercenary-dens/${denId}`,
        body: {
          id: denId,
          type_id: 81080,
          state: 'Running',
          skyhook: {
            id: 200000001,
            planet_id: 40000002,
            corporation_id: 98000002,
          },
          infomorphs: { amount: 100 },
          evolution: {
            development: { level: 3, progress: 0.75 },
            anarchy: { level: 2, progress: 0.4 },
          },
        },
      });
    });

    when('the client requests den detail', async () => {
      result = await client.mercenary.getMercenaryDenDetail(
        TEST_CHARACTER_ID,
        denId,
      );
    });

    then('the client shall return the den evolution and infomorph data', () => {
      expect(lastRequest().url.pathname).toMatch(
        new RegExp(
          `/characters/${TEST_CHARACTER_ID}/structures/mercenary-dens/${denId}/?$`,
        ),
      );
      expect(result.id).toBe(denId);
      expect(result.state).toBe('Running');
      expect(result.infomorphs).toEqual({ amount: 100 });
      expect(result.skyhook).toEqual({
        id: 200000001,
        planet_id: 40000002,
        corporation_id: 98000002,
      });
      expect(result.evolution.development.level).toBe(3);
      expect(result.evolution.anarchy.level).toBe(2);
    });
  });

  test('Available operation reports its dungeon type and expiry time', ({
    given,
    when,
    then,
  }) => {
    const operationId = '3868eaed-8278-4cb7-9709-7d7de9c20dc7';
    let result: any;

    given('an MTO exists with detail data', () => {
      queueResponse({
        match: `/mercenary-tactical-operations/${operationId}`,
        body: {
          id: operationId,
          mercenary_den_id: 5001,
          state: 'Available',
          dungeon_type_id: 12367,
          expires: '2026-05-20T22:00:00Z',
        },
      });
    });

    when('the client requests operation detail', async () => {
      result = await client.mercenary.getMercenaryTacticalOperationDetail(
        TEST_CHARACTER_ID,
        '3868eaed-8278-4cb7-9709-7d7de9c20dc7',
      );
    });

    then('the client shall return the operation state and expiry', () => {
      expect(lastRequest().url.pathname).toMatch(
        new RegExp(
          `/characters/${TEST_CHARACTER_ID}/mercenary-tactical-operations/${operationId}/?$`,
        ),
      );
      expect(result.id).toBe(operationId);
      expect(result.state).toBe('Available');
      expect(result.dungeon_type_id).toBe(12367);
      expect(result.expires).toBe('2026-05-20T22:00:00Z');
    });
  });

  test('Den request during an ESI outage is rejected with 503', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('the ESI service is down', () => {
      // 503 is retryable, so the outage has to outlast the retry budget.
      queueError(503, 'Service Unavailable', {
        match: DENS_LIST,
        times: RETRYABLE_ATTEMPTS,
      });
    });

    when('the client requests mercenary data', async () => {
      try {
        await client.mercenary.getMercenaryDens(TEST_CHARACTER_ID);
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
});
