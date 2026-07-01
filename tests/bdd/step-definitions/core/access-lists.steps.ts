import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/access-lists.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      accessToken: 'test-token',
      timeout: 5000,
    });
  });

  test('WHEN getting access list with mixed entity types, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given(
      'an access list exists with characters, corporations, and alliances',
      () => {
        const expectedList = {
          access_list_id: 42,
          name: 'Station Docking ACL',
          entries: [
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
        };

        jest
          .spyOn(client.accessLists, 'getAccessList')
          .mockResolvedValue(expectedList as any);
      },
    );

    when('the client requests the access list', async () => {
      result = await client.accessLists.getAccessList(42);
    });

    then('the client shall return all entries with their access types', () => {
      expect(result).toBeDefined();
      expect(result.access_list_id).toBe(42);
      expect(result.name).toBe('Station Docking ACL');
      expect(result.entries).toHaveLength(3);

      const allowed = result.entries.filter(
        (e: any) => e.access_type === 'allowed',
      );
      const blocked = result.entries.filter(
        (e: any) => e.access_type === 'blocked',
      );
      expect(allowed).toHaveLength(2);
      expect(blocked).toHaveLength(1);
    });
  });

  test('WHILE access list with no entries, the client shall return an empty result', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('an empty access list exists', () => {
      const emptyList = {
        access_list_id: 99,
        name: 'Empty ACL',
        entries: [],
      };

      jest
        .spyOn(client.accessLists, 'getAccessList')
        .mockResolvedValue(emptyList as any);
    });

    when('the client requests the empty access list', async () => {
      result = await client.accessLists.getAccessList(99);
    });

    then('the client shall return the list with an empty entries array', () => {
      expect(result).toBeDefined();
      expect(result.access_list_id).toBe(99);
      expect(result.entries).toHaveLength(0);
    });
  });

  test('IF unauthorized access to access list, THEN the client shall return a forbidden error', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('no valid token is provided', () => {
      const error = TestDataFactory.createError(401);

      jest.spyOn(client.accessLists, 'getAccessList').mockRejectedValue(error);
    });

    when('the client requests an access list without auth', async () => {
      try {
        await client.accessLists.getAccessList(42);
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a 401 error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('IF access list not found, THEN the client shall return a not-found error', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('an access list does not exist', () => {
      const error = TestDataFactory.createError(404);

      jest.spyOn(client.accessLists, 'getAccessList').mockRejectedValue(error);
    });

    when('the client requests a non-existent access list', async () => {
      try {
        await client.accessLists.getAccessList(999999);
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a 404 error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });
});
