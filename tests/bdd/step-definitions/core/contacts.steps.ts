import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/contacts.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('WHEN getting contacts for a valid character, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character with contacts', () => {
      const expectedContacts = [
        {
          contact_id: 123456789,
          contact_type: 'character' as const,
          standing: 10.0,
          label_ids: [1],
        },
        {
          contact_id: 987654321,
          contact_type: 'corporation' as const,
          standing: 5.0,
          label_ids: [2],
        },
        {
          contact_id: 99005338,
          contact_type: 'alliance' as const,
          standing: -10.0,
          label_ids: [],
        },
      ];

      jest
        .spyOn(client.contacts, 'getCharacterContacts')
        .mockResolvedValue(expectedContacts);
    });

    when('the client requests character contacts', async () => {
      result = await client.contacts.getCharacterContacts(characterId);
    });

    then('the client shall return a list of contacts with standings', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('contact_id', 123456789);
      expect(result[0]).toHaveProperty('contact_type', 'character');
      expect(result[0]).toHaveProperty('standing', 10.0);
      expect(result[0]).toHaveProperty('label_ids');
      expect(result[2].standing).toBe(-10.0);
    });
  });

  test('WHILE empty contacts list, the client shall return an empty result', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character with no contacts', () => {
      const emptyContacts: any[] = [];

      jest
        .spyOn(client.contacts, 'getCharacterContacts')
        .mockResolvedValue(emptyContacts);
    });

    when(
      'the client requests character contacts for the empty list',
      async () => {
        result = await client.contacts.getCharacterContacts(characterId);
      },
    );

    then('the client shall return an empty array', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });
  });

  test('IF unauthorized access to contacts, THEN the client shall return a forbidden error', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let error: any;

    given('an invalid or expired token for contacts', () => {
      const forbiddenError = TestDataFactory.createError(403);

      jest
        .spyOn(client.contacts, 'getCharacterContacts')
        .mockRejectedValue(forbiddenError);
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
    });
  });

  test('WHEN getting contact labels for a character, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character with custom labels', () => {
      const expectedLabels = [
        { label_id: 1, label_name: 'Friendly' },
        { label_id: 2, label_name: 'Hostile' },
        { label_id: 3, label_name: 'Neutral' },
      ];

      jest
        .spyOn(client.contacts, 'getCharacterContactLabels')
        .mockResolvedValue(expectedLabels);
    });

    when('the client requests contact labels', async () => {
      result = await client.contacts.getCharacterContactLabels(characterId);
    });

    then('the client shall return the label definitions', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('label_id', 1);
      expect(result[0]).toHaveProperty('label_name', 'Friendly');
      expect(result[1]).toHaveProperty('label_name', 'Hostile');
    });
  });

  test('WHEN adding new contacts to a character contact list, the client shall add the entries', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;
    let newContacts: any;

    given('contact data with standings', () => {
      newContacts = {
        contact_ids: [111111111, 222222222],
        standing: 5.0,
        label_ids: [1],
      };
      const expectedIds = [111111111, 222222222];

      jest
        .spyOn(client.contacts, 'postCharacterContacts')
        .mockResolvedValue(expectedIds);
    });

    when('the client adds contacts', async () => {
      result = await client.contacts.postCharacterContacts(
        characterId,
        5,
        [111111111, 222222222],
      );
    });

    then('the client shall return the IDs of the added contacts', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result).toContain(111111111);
      expect(result).toContain(222222222);
    });
  });

  test('WHEN removing contacts from a character contact list, the client shall complete the operation', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const contactIds = [111111111, 222222222];

    given('existing contact IDs', () => {
      jest
        .spyOn(client.contacts, 'deleteCharacterContacts')
        .mockResolvedValue(undefined);
    });

    when('the client deletes those contacts', async () => {
      await client.contacts.deleteCharacterContacts(characterId, contactIds);
    });

    then('the deletion shall complete successfully', () => {
      expect(client.contacts.deleteCharacterContacts).toHaveBeenCalledWith(
        characterId,
        contactIds,
      );
    });
  });

  test('WHEN getting contacts for a corporation, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const corporationId = 1344654522;
    let result: any;

    given('a valid corporation ID for contacts', () => {
      const expectedContacts = [
        {
          contact_id: 99005338,
          contact_type: 'alliance' as const,
          standing: 10.0,
          label_ids: [],
        },
        {
          contact_id: 555555555,
          contact_type: 'character' as const,
          standing: -5.0,
          label_ids: [1],
        },
      ];

      jest
        .spyOn(client.contacts, 'getCorporationContacts')
        .mockResolvedValue(expectedContacts);
    });

    when('the client requests corporation contacts', async () => {
      result = await client.contacts.getCorporationContacts(corporationId);
    });

    then('the client shall return the corporation contact list', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('contact_id', 99005338);
      expect(result[0]).toHaveProperty('contact_type', 'alliance');
      expect(result[1]).toHaveProperty('standing', -5.0);
    });
  });

  test('WHEN getting corporation contact labels, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const corporationId = 1344654522;
    let result: any;

    given('a corporation with custom labels', () => {
      const expectedLabels = [
        { label_id: 1, label_name: 'War Target' },
        { label_id: 2, label_name: 'Ally' },
      ];

      jest
        .spyOn(client.contacts, 'getCorporationContactLabels')
        .mockResolvedValue(expectedLabels);
    });

    when('the client requests corporation contact labels', async () => {
      result = await client.contacts.getCorporationContactLabels(corporationId);
    });

    then('the client shall return the corporation label definitions', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('label_name', 'War Target');
    });
  });

  test('WHEN completing contact management workflow - list, add, and verify, the client shall complete all steps', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let finalContacts: any;

    given('a character managing contacts', () => {
      const initialContacts = [
        {
          contact_id: 123456789,
          contact_type: 'character' as const,
          standing: 10.0,
          label_ids: [],
        },
      ];

      const labels = [{ label_id: 1, label_name: 'Friendly' }];

      const updatedContacts = [
        ...initialContacts,
        {
          contact_id: 333333333,
          contact_type: 'character' as const,
          standing: 5.0,
          label_ids: [1],
        },
      ];

      jest
        .spyOn(client.contacts, 'getCharacterContacts')
        .mockResolvedValueOnce(initialContacts)
        .mockResolvedValueOnce(updatedContacts);
      jest
        .spyOn(client.contacts, 'getCharacterContactLabels')
        .mockResolvedValue(labels);
      jest
        .spyOn(client.contacts, 'postCharacterContacts')
        .mockResolvedValue([333333333]);
    });

    when('the client lists contacts then add new ones and verify', async () => {
      const [contacts, contactLabels] = await Promise.all([
        client.contacts.getCharacterContacts(characterId),
        client.contacts.getCharacterContactLabels(characterId),
      ]);

      expect(contacts).toHaveLength(1);
      expect(contactLabels).toHaveLength(1);

      await client.contacts.postCharacterContacts(characterId, 5, [333333333]);

      finalContacts = await client.contacts.getCharacterContacts(characterId);
    });

    then('the full workflow shall succeed', () => {
      expect(finalContacts).toHaveLength(2);
      expect(finalContacts[1].contact_id).toBe(333333333);
      expect(finalContacts[1].standing).toBe(5.0);
    });
  });
});
