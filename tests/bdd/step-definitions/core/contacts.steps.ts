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

  test('Get contacts for a valid character', ({ given, when, then }) => {
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

    when('I request character contacts', async () => {
      result = await client.contacts.getCharacterContacts(characterId);
    });

    then('I should receive a list of contacts with standings', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('contact_id', 123456789);
      expect(result[0]).toHaveProperty('contact_type', 'character');
      expect(result[0]).toHaveProperty('standing', 10.0);
      expect(result[0]).toHaveProperty('label_ids');
      expect(result[2].standing).toBe(-10.0);
    });
  });

  test('Handle empty contacts list', ({ given, when, then }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character with no contacts', () => {
      const emptyContacts: any[] = [];

      jest
        .spyOn(client.contacts, 'getCharacterContacts')
        .mockResolvedValue(emptyContacts);
    });

    when('I request character contacts for the empty list', async () => {
      result = await client.contacts.getCharacterContacts(characterId);
    });

    then('I should receive an empty array', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });
  });

  test('Handle unauthorized access to contacts', ({ given, when, then }) => {
    const characterId = 1689391488;
    let error: any;

    given('an invalid or expired token for contacts', () => {
      const forbiddenError = TestDataFactory.createError(403);

      jest
        .spyOn(client.contacts, 'getCharacterContacts')
        .mockRejectedValue(forbiddenError);
    });

    when('I request character contacts without authorization', async () => {
      try {
        await client.contacts.getCharacterContacts(characterId);
      } catch (e) {
        error = e;
      }
    });

    then('I should receive a 403 forbidden error', () => {
      expect(error).toBeInstanceOf(EsiError);
    });
  });

  test('Get contact labels for a character', ({ given, when, then }) => {
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

    when('I request contact labels', async () => {
      result = await client.contacts.getCharacterContactLabels(characterId);
    });

    then('I should receive the label definitions', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('label_id', 1);
      expect(result[0]).toHaveProperty('label_name', 'Friendly');
      expect(result[1]).toHaveProperty('label_name', 'Hostile');
    });
  });

  test('Add new contacts to a character contact list', ({
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

    when('I add contacts', async () => {
      result = await client.contacts.postCharacterContacts(
        characterId,
        newContacts,
      );
    });

    then('I should receive the IDs of the added contacts', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result).toContain(111111111);
      expect(result).toContain(222222222);
    });
  });

  test('Remove contacts from a character contact list', ({
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

    when('I delete those contacts', async () => {
      await client.contacts.deleteCharacterContacts(characterId, contactIds);
    });

    then('the deletion should complete successfully', () => {
      expect(client.contacts.deleteCharacterContacts).toHaveBeenCalledWith(
        characterId,
        contactIds,
      );
    });
  });

  test('Get contacts for a corporation', ({ given, when, then }) => {
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

    when('I request corporation contacts', async () => {
      result = await client.contacts.getCorporationContacts(corporationId);
    });

    then('I should receive the corporation contact list', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('contact_id', 99005338);
      expect(result[0]).toHaveProperty('contact_type', 'alliance');
      expect(result[1]).toHaveProperty('standing', -5.0);
    });
  });

  test('Get corporation contact labels', ({ given, when, then }) => {
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

    when('I request corporation contact labels', async () => {
      result = await client.contacts.getCorporationContactLabels(corporationId);
    });

    then('I should receive the corporation label definitions', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('label_name', 'War Target');
    });
  });

  test('Complete contact management workflow - list, add, and verify', ({
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

    when('I list contacts then add new ones and verify', async () => {
      const newContactData = {
        contact_ids: [333333333],
        standing: 5.0,
        label_ids: [1],
      };

      const [contacts, contactLabels] = await Promise.all([
        client.contacts.getCharacterContacts(characterId),
        client.contacts.getCharacterContactLabels(characterId),
      ]);

      expect(contacts).toHaveLength(1);
      expect(contactLabels).toHaveLength(1);

      await client.contacts.postCharacterContacts(characterId, newContactData);

      finalContacts = await client.contacts.getCharacterContacts(characterId);
    });

    then('the full workflow should succeed', () => {
      expect(finalContacts).toHaveLength(2);
      expect(finalContacts[1].contact_id).toBe(333333333);
      expect(finalContacts[1].standing).toBe(5.0);
    });
  });
});
