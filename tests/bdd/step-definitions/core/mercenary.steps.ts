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
const DEN_ID = 1046664005001;
const OPERATION_ID = '3868eaed-8278-4cb7-9709-7d7de9c20dc7';

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

  test('Two dens return their ids and planets', ({ given, when, then }) => {
    let result: any;
    // The shape the ESI spec declares: the list wrapped in mercenary_dens.
    const densResponse = {
      mercenary_dens: [
        { id: DEN_ID, planet_id: 40009077 },
        { id: 1046664005002, planet_id: 40009078 },
      ],
    };

    given('mercenary dens exist', () => {
      queueResponse({ match: DENS_LIST, body: densResponse });
    });

    when('the client requests dens', async () => {
      result = await client.mercenary.getMercenaryDens(TEST_CHARACTER_ID);
    });

    then(
      'the client shall return the mercenary_dens list with ids and planets',
      () => {
        const request = lastRequest();
        expect(request.method).toBe('GET');
        expect(request.url.pathname).toMatch(
          new RegExp(
            `/characters/${TEST_CHARACTER_ID}/structures/mercenary-dens/?$`,
          ),
        );
        expect(request.headers['authorization']).toBe(
          'Bearer bdd-access-token',
        );
        expect(
          result.mercenary_dens.map((d: any) => [d.id, d.planet_id]),
        ).toEqual([
          [DEN_ID, 40009077],
          [1046664005002, 40009078],
        ]);
      },
    );
  });

  test('Character with no dens receives an empty mercenary_dens list', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('no dens exist in the area', () => {
      queueResponse({ match: DENS_LIST, body: { mercenary_dens: [] } });
    });

    when('the client requests dens', async () => {
      result = await client.mercenary.getMercenaryDens(TEST_CHARACTER_ID);
    });

    then('the client shall return an empty mercenary_dens list', () => {
      expect(sentRequests()).toHaveLength(1);
      expect(result).toEqual({ mercenary_dens: [] });
    });
  });

  test('Two operations return their UUIDs and parent den ids', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    // The shape the ESI spec declares: the list wrapped in operations.
    const operationsResponse = {
      operations: [
        { id: OPERATION_ID, mercenary_den_id: DEN_ID },
        {
          id: '9b1c2d3e-4f50-4a61-8b72-c3d4e5f60718',
          mercenary_den_id: 1046664005002,
        },
      ],
    };

    given('MTOs are active', () => {
      queueResponse({ match: OPS_LIST, body: operationsResponse });
    });

    when('the client requests operations', async () => {
      result =
        await client.mercenary.getMercenaryTacticalOperations(
          TEST_CHARACTER_ID,
        );
    });

    then(
      'the client shall return the operations list with UUIDs and den ids',
      () => {
        expect(lastRequest().url.pathname).toMatch(
          new RegExp(
            `/characters/${TEST_CHARACTER_ID}/mercenary-tactical-operations/?$`,
          ),
        );
        expect(
          result.operations.map((op: any) => [op.id, op.mercenary_den_id]),
        ).toEqual([
          [OPERATION_ID, DEN_ID],
          ['9b1c2d3e-4f50-4a61-8b72-c3d4e5f60718', 1046664005002],
        ]);
      },
    );
  });

  test('Operation mercenary_den_id matches the parent den fetched alongside it', ({
    given,
    when,
    then,
  }) => {
    let denResults: any;
    let opResults: any;

    given('dens and MTOs exist', () => {
      queueResponse({
        match: DENS_LIST,
        body: { mercenary_dens: [{ id: DEN_ID, planet_id: 40009077 }] },
      });
      queueResponse({
        match: OPS_LIST,
        body: { operations: [{ id: OPERATION_ID, mercenary_den_id: DEN_ID }] },
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
      expect(denResults.mercenary_dens.map((d: any) => d.id)).toEqual([DEN_ID]);
      expect(opResults.operations.map((op: any) => op.id)).toEqual([
        OPERATION_ID,
      ]);
      expect(opResults.operations[0].mercenary_den_id).toBe(
        denResults.mercenary_dens[0].id,
      );
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
            development: { amount: 75, level: 'Level3' },
            anarchy: { amount: 40, level: 'Level2' },
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
      expect(result.evolution).toEqual({
        development: { amount: 75, level: 'Level3' },
        anarchy: { amount: 40, level: 'Level2' },
      });
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
