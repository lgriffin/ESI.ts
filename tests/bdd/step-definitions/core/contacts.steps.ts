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

const feature = loadFeature('tests/bdd/features/core/0008-contacts.feature');

/**
 * Match a URL whose path ends exactly at `path`, so `/contacts` does not also
 * serve `/contacts/labels`.
 */
function exactPath(path: string): RegExp {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^https://esi\\.evetech\\.net${escaped}(\\?|$)`);
}

const BEARER = 'Bearer bdd-access-token';

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Character contact list spanning character, corporation, and alliance entries', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const contacts = [
      {
        contact_id: 123456789,
        contact_type: 'character',
        standing: 10.0,
        label_ids: [1],
        is_watched: true,
        is_blocked: false,
      },
      {
        contact_id: 987654321,
        contact_type: 'corporation',
        standing: 5.0,
        label_ids: [2],
      },
      {
        contact_id: 99005338,
        contact_type: 'alliance',
        standing: -10.0,
        label_ids: [2, 3],
      },
    ];
    let result: any;

    given('a character with contacts', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/contacts`),
        headers: { 'x-pages': '1' },
        body: contacts,
      });
    });

    when('the client requests character contacts', async () => {
      result = await client.contacts.getCharacterContacts(characterId);
    });

    then('the client shall return a list of contacts with standings', () => {
      expect(lastRequest().method).toBe('GET');
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/contacts`,
      );
      expect(lastRequest().headers.authorization).toBe(BEARER);
      expect(result).toEqual(contacts);
      expect(
        result.map((c: any) => [c.contact_type, c.standing, c.label_ids]),
      ).toEqual([
        ['character', 10.0, [1]],
        ['corporation', 5.0, [2]],
        ['alliance', -10.0, [2, 3]],
      ]);
    });
  });

  test('Character with an empty contact list', ({ given, when, then }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character with no contacts', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/contacts`),
        headers: { 'x-pages': '1' },
        body: [],
      });
    });

    when(
      'the client requests character contacts for the empty list',
      async () => {
        result = await client.contacts.getCharacterContacts(characterId);
      },
    );

    then('the client shall return an empty array', () => {
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/contacts`,
      );
      expect(result).toEqual([]);
    });
  });

  test('Expired token on the character contacts endpoint rejects the request', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let error: any;

    given('an invalid or expired token for contacts', () => {
      queueError(403, 'token not valid for scope', {
        match: exactPath(`/characters/${characterId}/contacts`),
      });
    });

    when(
      'the client requests character contacts without authorization',
      async () => {
        try {
          await client.contacts.getCharacterContacts(characterId);
        } catch (e) {
          error = e;
        }
      },
    );

    then('the client shall return a 403 forbidden error', () => {
      expect(error).toBeInstanceOf(EsiError);
      expect((error as EsiError).statusCode).toBe(403);
      // 403 is not retried.
      expect(sentRequests()).toHaveLength(1);
      expect(lastRequest().headers.authorization).toBe(BEARER);
    });
  });

  test('Character labels naming friendly, hostile, and neutral', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character with custom labels', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/contacts/labels`),
        body: [
          { label_id: 1, label_name: 'Friendly' },
          { label_id: 2, label_name: 'Hostile' },
          { label_id: 3, label_name: 'Neutral' },
        ],
      });
    });

    when('the client requests contact labels', async () => {
      result = await client.contacts.getCharacterContactLabels(characterId);
    });

    then('the client shall return the label definitions', () => {
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/contacts/labels`,
      );
      expect(result).toEqual([
        { label_id: 1, label_name: 'Friendly' },
        { label_id: 2, label_name: 'Hostile' },
        { label_id: 3, label_name: 'Neutral' },
      ]);
    });
  });

  test('Two contacts added at standing five', ({ given, when, then }) => {
    const characterId = 1689391488;
    let result: any;

    given('contact data with standings', () => {
      // ESI answers a successful add with 201 Created and the created IDs.
      queueResponse({
        match: exactPath(`/characters/${characterId}/contacts`),
        status: 201,
        body: [111111111, 222222222],
      });
    });

    when('the client adds contacts', async () => {
      result = await client.contacts.postCharacterContacts(
        characterId,
        5,
        [111111111, 222222222],
      );
    });

    then('the client shall return the IDs of the added contacts', () => {
      const request = lastRequest();
      expect(sentRequests()).toHaveLength(1);
      expect(request.method).toBe('POST');
      expect(request.url.pathname).toBe(`/characters/${characterId}/contacts`);
      expect(request.url.searchParams.get('standing')).toBe('5');
      expect(request.headers.authorization).toBe(BEARER);
      expect(JSON.parse(request.body!)).toEqual([111111111, 222222222]);
      expect(result).toEqual([111111111, 222222222]);
    });
  });

  test('Two contacts deleted by ID', ({ given, when, then }) => {
    const characterId = 1689391488;
    const contactIds = [111111111, 222222222];

    given('existing contact IDs', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/contacts`),
        status: 204,
      });
    });

    when('the client deletes those contacts', async () => {
      await client.contacts.deleteCharacterContacts(characterId, contactIds);
    });

    then('the deletion shall complete successfully', () => {
      const request = lastRequest();
      expect(sentRequests()).toHaveLength(1);
      expect(request.method).toBe('DELETE');
      expect(request.url.pathname).toBe(`/characters/${characterId}/contacts`);
      expect(request.url.searchParams.get('contact_ids')).toBe(
        '111111111,222222222',
      );
      expect(request.headers.authorization).toBe(BEARER);
      expect(request.body).toBeUndefined();
    });
  });

  test('Corporation contact list holding an allied alliance and a hostile character', ({
    given,
    when,
    then,
  }) => {
    const corporationId = 1344654522;
    let result: any;

    given('a valid corporation ID for contacts', () => {
      queueResponse({
        match: exactPath(`/corporations/${corporationId}/contacts`),
        headers: { 'x-pages': '1' },
        body: [
          {
            contact_id: 99005338,
            contact_type: 'alliance',
            standing: 10.0,
            label_ids: [2],
          },
          {
            contact_id: 555555555,
            contact_type: 'character',
            standing: -5.0,
            label_ids: [1],
            is_watched: false,
          },
        ],
      });
    });

    when('the client requests corporation contacts', async () => {
      result = await client.contacts.getCorporationContacts(corporationId);
    });

    then('the client shall return the corporation contact list', () => {
      expect(lastRequest().url.pathname).toBe(
        `/corporations/${corporationId}/contacts`,
      );
      expect(lastRequest().headers.authorization).toBe(BEARER);
      expect(
        result.map((c: any) => [
          c.contact_id,
          c.contact_type,
          c.standing,
          c.label_ids,
        ]),
      ).toEqual([
        [99005338, 'alliance', 10.0, [2]],
        [555555555, 'character', -5.0, [1]],
      ]);
    });
  });

  test('Corporation labels naming war targets and allies', ({
    given,
    when,
    then,
  }) => {
    const corporationId = 1344654522;
    let result: any;

    given('a corporation with custom labels', () => {
      queueResponse({
        match: exactPath(`/corporations/${corporationId}/contacts/labels`),
        body: [
          { label_id: 1, label_name: 'War Target' },
          { label_id: 2, label_name: 'Ally' },
        ],
      });
    });

    when('the client requests corporation contact labels', async () => {
      result = await client.contacts.getCorporationContactLabels(corporationId);
    });

    then('the client shall return the corporation label definitions', () => {
      expect(lastRequest().url.pathname).toBe(
        `/corporations/${corporationId}/contacts/labels`,
      );
      expect(result).toEqual([
        { label_id: 1, label_name: 'War Target' },
        { label_id: 2, label_name: 'Ally' },
      ]);
    });
  });

  test('List, add, and re-read showing the new contact', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const contactsPath = `/characters/${characterId}/contacts`;
    const existing = {
      contact_id: 123456789,
      contact_type: 'character',
      standing: 10.0,
      label_ids: [1],
    };
    const added = {
      contact_id: 333333333,
      contact_type: 'character',
      standing: 5.0,
      label_ids: [1],
    };
    let initialContacts: any;
    let contactLabels: any;
    let addedIds: any;
    let finalContacts: any;

    given('a character managing contacts', () => {
      // Real ESI list responses carry an ETag, so the first read is cached.
      queueResponse({
        match: exactPath(contactsPath),
        headers: { 'x-pages': '1', etag: '"contacts-v1"' },
        body: [existing],
      });
      queueResponse({
        match: exactPath(`${contactsPath}/labels`),
        headers: { etag: '"labels-v1"' },
        body: [{ label_id: 1, label_name: 'Friendly' }],
      });
      queueResponse({
        match: exactPath(contactsPath),
        status: 201,
        body: [333333333],
      });
      queueResponse({
        match: exactPath(contactsPath),
        headers: { 'x-pages': '1', etag: '"contacts-v2"' },
        body: [existing, added],
      });
    });

    when('the client lists contacts then add new ones and verify', async () => {
      [initialContacts, contactLabels] = await Promise.all([
        client.contacts.getCharacterContacts(characterId),
        client.contacts.getCharacterContactLabels(characterId),
      ]);

      addedIds = await client.contacts.postCharacterContacts(
        characterId,
        5,
        [333333333],
      );

      finalContacts = await client.contacts.getCharacterContacts(characterId);
    });

    then('the full workflow shall succeed', () => {
      expect(initialContacts).toEqual([existing]);
      expect(contactLabels).toEqual([{ label_id: 1, label_name: 'Friendly' }]);
      expect(addedIds).toEqual([333333333]);

      // The second read goes back to ESI rather than answering from the
      // cached first read.
      const requests = sentRequests();
      expect(requests).toHaveLength(4);
      expect(requests[2].method).toBe('POST');
      expect(requests[3].method).toBe('GET');
      expect(requests[3].url.pathname).toBe(contactsPath);

      expect(finalContacts).toEqual([existing, added]);
      expect(finalContacts[1].contact_id).toBe(333333333);
      expect(finalContacts[1].standing).toBe(5.0);
    });
  });
});
