import { defineFeature, loadFeature } from 'jest-cucumber';
import fetchMock from 'jest-fetch-mock';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import {
  createSeamClient,
  lastRequest,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature('tests/bdd/features/core/0013-fittings.feature');

const BEARER = 'Bearer bdd-access-token';

/** Matches the fittings collection URL, not an individual fitting. */
const fittingsCollection = (characterId: number) =>
  new RegExp(`/characters/${characterId}/fittings(\\?|$)`);

/**
 * Local workaround for a seam gap: transport.ts encodes a body-less response
 * as an empty string, and the Response constructor rejects any body on 204.
 * ESI answers a fitting delete with 204 No Content, so rebuild that response
 * with a null body. The seam has already recorded the request and consumed
 * the queued entry when the constructor throws, so its strictness holds.
 * Must be registered after useHttpTransport().
 */
function allowNoContentResponses(): void {
  beforeEach(() => {
    const serve = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (input, init) => {
      try {
        return await serve(input, init);
      } catch (error) {
        if (/Invalid response status code 204/.test(String(error))) {
          return new Response(null, { status: 204 });
        }
        throw error;
      }
    });
  });
}

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();
  allowNoContentResponses();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Two saved fittings expand to full module lists', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 1689391488;

    given('a character with saved fittings', () => {
      queueResponse({
        match: fittingsCollection(characterId),
        body: [
          {
            fitting_id: 1,
            name: 'PvP Hurricane',
            ship_type_id: 24690,
            description: 'Standard hurricane fleet fit',
            items: [
              { type_id: 2488, flag: 'HiSlot0', quantity: 1 },
              { type_id: 519, flag: 'LoSlot0', quantity: 1 },
            ],
          },
          {
            fitting_id: 2,
            name: 'Ratting Vexor Navy Issue',
            ship_type_id: 29340,
            description: 'AFK ratting fit',
            items: [
              { type_id: 4405, flag: 'LoSlot1', quantity: 1 },
              { type_id: 2185, flag: 'DroneBay', quantity: 5 },
            ],
          },
        ],
      });
    });

    when('the client requests their fittings', async () => {
      result = await client.fittings.getFittings(characterId);
    });

    then('the client shall return an array of fitting details', () => {
      const request = lastRequest();
      expect(request.method).toBe('GET');
      expect(request.url.pathname).toMatch(
        new RegExp(`/characters/${characterId}/fittings$`),
      );
      expect(request.headers.authorization).toBe(BEARER);

      expect(
        result.map((f: any) => [f.fitting_id, f.name, f.ship_type_id]),
      ).toEqual([
        [1, 'PvP Hurricane', 24690],
        [2, 'Ratting Vexor Navy Issue', 29340],
      ]);
      expect(result[0].items).toEqual([
        { type_id: 2488, flag: 'HiSlot0', quantity: 1 },
        { type_id: 519, flag: 'LoSlot0', quantity: 1 },
      ]);
      expect(result[1].items).toEqual([
        { type_id: 4405, flag: 'LoSlot1', quantity: 1 },
        { type_id: 2185, flag: 'DroneBay', quantity: 5 },
      ]);
    });
  });

  test('Character who has saved no fittings', ({ given, when, then }) => {
    let result: any;
    const characterId = 1689391488;

    given('a character with no saved fittings', () => {
      queueResponse({ match: fittingsCollection(characterId), body: [] });
    });

    when('the client requests their fittings list', async () => {
      result = await client.fittings.getFittings(characterId);
    });

    then('the client shall return an empty array', () => {
      expect(sentRequests()).toHaveLength(1);
      expect(result).toEqual([]);
    });
  });

  test('New fitting returns the assigned ID', ({ given, when, then }) => {
    let result: any;
    const characterId = 1689391488;
    let fittingData: any;

    given('valid fitting data', () => {
      fittingData = {
        name: 'Fleet Ferox',
        ship_type_id: 37480,
        description: 'Standard ferox fleet doctrine',
        items: [
          { type_id: 3170, flag: 'HiSlot0', quantity: 1 },
          { type_id: 3186, flag: 'MedSlot0', quantity: 1 },
          { type_id: 2281, flag: 'LoSlot0', quantity: 1 },
        ],
      };
      queueResponse({
        match: fittingsCollection(characterId),
        status: 201,
        body: { fitting_id: 42 },
      });
    });

    when('the client creates a new fitting', async () => {
      result = await client.fittings.createFitting(characterId, fittingData);
    });

    then('the client shall return the new fitting ID', () => {
      const request = lastRequest();
      expect(request.method).toBe('POST');
      expect(request.headers.authorization).toBe(BEARER);
      expect(JSON.parse(request.body!)).toEqual(fittingData);
      expect(result).toEqual({ fitting_id: 42 });
    });
  });

  test('Fully fitted battleship returns the assigned ID', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 1689391488;
    let fullFittingData: any;

    given('a fully fitted ship', () => {
      fullFittingData = {
        name: 'Max Fit Raven',
        ship_type_id: 638,
        description: 'Fully fitted Raven for L4 missions',
        items: [
          { type_id: 3170, flag: 'HiSlot0', quantity: 1 },
          { type_id: 3170, flag: 'HiSlot1', quantity: 1 },
          { type_id: 3170, flag: 'HiSlot2', quantity: 1 },
          { type_id: 3170, flag: 'HiSlot3', quantity: 1 },
          { type_id: 3170, flag: 'HiSlot4', quantity: 1 },
          { type_id: 3170, flag: 'HiSlot5', quantity: 1 },
          { type_id: 519, flag: 'MedSlot0', quantity: 1 },
          { type_id: 519, flag: 'MedSlot1', quantity: 1 },
        ],
      };
      queueResponse({
        match: fittingsCollection(characterId),
        status: 201,
        body: { fitting_id: 100 },
      });
    });

    when('the client saves the fitting', async () => {
      result = await client.fittings.createFitting(
        characterId,
        fullFittingData,
      );
    });

    then('the fitting shall be created with all module slots populated', () => {
      const request = lastRequest();
      expect(request.method).toBe('POST');
      const sent = JSON.parse(request.body!);
      expect(sent.items).toHaveLength(8);
      expect(sent).toEqual(fullFittingData);
      expect(result).toEqual({ fitting_id: 100 });
    });
  });

  test('Deleting a fitting resolves with no body', ({ given, when, then }) => {
    let result: any;
    const characterId = 1689391488;
    const fittingId = 42;

    given('a valid fitting ID', () => {
      queueResponse({
        match: `/characters/${characterId}/fittings/${fittingId}`,
        status: 204,
      });
    });

    when('the client deletes the fitting', async () => {
      result = await client.fittings.deleteFitting(characterId, fittingId);
    });

    then('the operation shall complete without error', () => {
      const request = lastRequest();
      expect(request.method).toBe('DELETE');
      expect(request.url.pathname).toMatch(
        new RegExp(`/characters/${characterId}/fittings/${fittingId}$`),
      );
      expect(request.headers.authorization).toBe(BEARER);
      expect(result).toBeUndefined();
    });
  });

  test('Listing fittings with an expired token', ({ given, when, then }) => {
    const characterId = 1689391488;
    let caughtError: any;

    given('an invalid or expired token for fittings', () => {
      queueError(403, 'token not valid for scope', {
        match: fittingsCollection(characterId),
      });
    });

    when('the client requests fittings with invalid token', async () => {
      try {
        await client.fittings.getFittings(characterId);
      } catch (error) {
        caughtError = error;
      }
    });

    then('the client shall return a 403 forbidden error for fittings', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(403);
      expect(sentRequests()).toHaveLength(1);
      expect(lastRequest().method).toBe('GET');
    });
  });

  test('Creating a fitting without the write scope', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let caughtError: any;
    let fittingData: any;

    given('insufficient permissions for fitting creation', () => {
      fittingData = {
        name: 'Forbidden Fit',
        ship_type_id: 24690,
        description: 'Should fail',
        items: [{ type_id: 519, flag: 'LoSlot0', quantity: 1 }],
      };
      queueError(403, 'token not valid for scope', {
        match: fittingsCollection(characterId),
      });
    });

    when('the client attempts to create a fitting', async () => {
      try {
        await client.fittings.createFitting(characterId, fittingData);
      } catch (error) {
        caughtError = error;
      }
    });

    then('the client shall return a 403 forbidden error for creation', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(403);
      expect(sentRequests()).toHaveLength(1);
      expect(lastRequest().method).toBe('POST');
    });
  });

  test('Create, list, then delete for one character', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let created: any;
    let fittings: any;
    let deleted: any;
    const fittingData = {
      name: 'Lifecycle Test Fit',
      ship_type_id: 24690,
      description: 'Test fitting lifecycle',
      items: [{ type_id: 519, flag: 'LoSlot0', quantity: 1 }],
    };

    given('a character for fitting lifecycle', () => {
      queueResponse({
        match: fittingsCollection(characterId),
        status: 201,
        body: { fitting_id: 99 },
      });
      queueResponse({
        match: fittingsCollection(characterId),
        body: [{ fitting_id: 99, ...fittingData }],
      });
      queueResponse({
        match: `/characters/${characterId}/fittings/99`,
        status: 204,
      });
    });

    when(
      'the client creates a fitting then list fittings then delete it',
      async () => {
        created = await client.fittings.createFitting(characterId, fittingData);
        fittings = await client.fittings.getFittings(characterId);
        deleted = await client.fittings.deleteFitting(
          characterId,
          created.fitting_id,
        );
      },
    );

    then('each operation shall succeed in sequence', () => {
      const requests = sentRequests();
      expect(requests.map((r) => [r.method, r.url.pathname])).toEqual([
        ['POST', expect.stringMatching(/\/characters\/1689391488\/fittings$/)],
        ['GET', expect.stringMatching(/\/characters\/1689391488\/fittings$/)],
        [
          'DELETE',
          expect.stringMatching(/\/characters\/1689391488\/fittings\/99$/),
        ],
      ]);
      expect(JSON.parse(requests[0].body!)).toEqual(fittingData);
      expect(created).toEqual({ fitting_id: 99 });
      expect(fittings).toEqual([{ fitting_id: 99, ...fittingData }]);
      expect(deleted).toBeUndefined();
    });
  });
});
