import { defineFeature, loadFeature } from 'jest-cucumber';
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

const feature = loadFeature(
  'tests/bdd/features/core/0039-access-lists.feature',
);

defineFeature(feature, (test) => {
  let client: EsiClient;
  const characterId = 1689391488;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('List mixing character, corporation, and alliance entries returns both access types', ({
    given,
    when,
    then,
  }) => {
    const accessListId = 42;
    const entries = [
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
    ];
    let result: any;

    given(
      'an access list exists with characters, corporations, and alliances',
      () => {
        queueResponse({
          match: `/characters/${characterId}/access-lists/${accessListId}`,
          body: {
            access_list_id: accessListId,
            name: 'Station Docking ACL',
            entries,
          },
        });
      },
    );

    when('the client requests the access list', async () => {
      result = await client.accessLists.getAccessList(
        characterId,
        accessListId,
      );
    });

    then('the client shall return all entries with their access types', () => {
      const request = lastRequest();
      expect(request.method).toBe('GET');
      expect(request.url.pathname).toContain(
        `/characters/${characterId}/access-lists/${accessListId}`,
      );
      expect(request.headers.authorization).toBe('Bearer bdd-access-token');

      expect(result.access_list_id).toBe(accessListId);
      expect(result.name).toBe('Station Docking ACL');
      expect(result.entries).toEqual(entries);
      expect(
        result.entries.map((e: any) => [e.entity_type, e.access_type]),
      ).toEqual([
        ['character', 'allowed'],
        ['corporation', 'allowed'],
        ['alliance', 'blocked'],
      ]);
    });
  });

  test('Empty list returns its identifier with a zero-length entries array', ({
    given,
    when,
    then,
  }) => {
    const accessListId = 99;
    let result: any;

    given('an empty access list exists', () => {
      queueResponse({
        match: `/characters/${characterId}/access-lists/${accessListId}`,
        body: { access_list_id: accessListId, name: 'Empty ACL', entries: [] },
      });
    });

    when('the client requests the empty access list', async () => {
      result = await client.accessLists.getAccessList(
        characterId,
        accessListId,
      );
    });

    then('the client shall return the list with an empty entries array', () => {
      expect(result).toEqual({
        access_list_id: accessListId,
        name: 'Empty ACL',
        entries: [],
      });
      expect(sentRequests()).toHaveLength(1);
    });
  });

  test('Expired token rejects the access list request with an EsiError', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('ESI rejects the access token as expired', () => {
      // A token ESI no longer accepts. A client with no token at all never
      // reaches ESI: the pipeline throws a plain NO_AUTH_TOKEN Error before
      // sending, so the refusal this Rule describes is ESI's 401.
      client = createSeamClient({ accessToken: 'expired-access-token' });
      queueError(401, 'token is expired', {
        match: `/characters/${characterId}/access-lists/42`,
      });
    });

    when('the client requests an access list with that token', async () => {
      try {
        await client.accessLists.getAccessList(characterId, 42);
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a 401 error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(401);
      expect(sentRequests()).toHaveLength(1);
      expect(lastRequest().headers.authorization).toBe(
        'Bearer expired-access-token',
      );
    });
  });

  test('Unknown list identifier rejects the request with an EsiError', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('an access list does not exist', () => {
      queueError(404, 'Access list not found', {
        match: `/characters/${characterId}/access-lists/999999`,
      });
    });

    when('the client requests a non-existent access list', async () => {
      try {
        await client.accessLists.getAccessList(characterId, 999999);
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a 404 error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(404);
      // 404 is not retryable: exactly one request reaches ESI.
      expect(sentRequests()).toHaveLength(1);
    });
  });
});
