/**
 * BDD-Style Tests for ContactsClient
 *
 * Tests contact management operations including character, corporation,
 * and alliance contacts, labels, adding/deleting contacts, and error handling.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD Scenarios: Contact Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  describe('Feature: Retrieve Character Contacts', () => {
    describe('Scenario: Get contacts for a valid character', () => {
      it('Given a character with contacts, When I request character contacts, Then I should receive a list of contacts with standings', async () => {
        // Given: A character with contacts
        const characterId = 1689391488;
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

        // When: I request character contacts
        const result = await client.contacts.getCharacterContacts(characterId);

        // Then: I should receive a list of contacts with standings
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(3);
        expect(result[0]).toHaveProperty('contact_id', 123456789);
        expect(result[0]).toHaveProperty('contact_type', 'character');
        expect(result[0]).toHaveProperty('standing', 10.0);
        expect(result[0]).toHaveProperty('label_ids');
        expect(result[2].standing).toBe(-10.0);
      });
    });

    describe('Scenario: Handle empty contacts list', () => {
      it('Given a character with no contacts, When I request character contacts, Then I should receive an empty array', async () => {
        // Given: A character with no contacts
        const characterId = 1689391488;
        const emptyContacts: any[] = [];

        jest
          .spyOn(client.contacts, 'getCharacterContacts')
          .mockResolvedValue(emptyContacts);

        // When: I request character contacts
        const result = await client.contacts.getCharacterContacts(characterId);

        // Then: I should receive an empty array
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(0);
      });
    });

    describe('Scenario: Handle unauthorized access', () => {
      it('Given an invalid or expired token, When I request character contacts, Then I should receive a 403 forbidden error', async () => {
        // Given: An invalid or expired token
        const characterId = 1689391488;
        const forbiddenError = TestDataFactory.createError(403);

        jest
          .spyOn(client.contacts, 'getCharacterContacts')
          .mockRejectedValue(forbiddenError);

        // When & Then: I request character contacts and expect a forbidden error
        await expect(
          client.contacts.getCharacterContacts(characterId),
        ).rejects.toThrow(EsiError);
      });
    });
  });

  describe('Feature: Retrieve Contact Labels', () => {
    describe('Scenario: Get contact labels for a character', () => {
      it('Given a character with custom labels, When I request contact labels, Then I should receive the label definitions', async () => {
        // Given: A character with custom labels
        const characterId = 1689391488;
        const expectedLabels = [
          { label_id: 1, label_name: 'Friendly' },
          { label_id: 2, label_name: 'Hostile' },
          { label_id: 3, label_name: 'Neutral' },
        ];

        jest
          .spyOn(client.contacts, 'getCharacterContactLabels')
          .mockResolvedValue(expectedLabels);

        // When: I request contact labels
        const result =
          await client.contacts.getCharacterContactLabels(characterId);

        // Then: I should receive the label definitions
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(3);
        expect(result[0]).toHaveProperty('label_id', 1);
        expect(result[0]).toHaveProperty('label_name', 'Friendly');
        expect(result[1]).toHaveProperty('label_name', 'Hostile');
      });
    });
  });

  describe('Feature: Add Contacts', () => {
    describe('Scenario: Add new contacts to a character contact list', () => {
      it('Given contact data with standings, When I add contacts, Then I should receive the IDs of the added contacts', async () => {
        // Given: Contact data with standings
        const characterId = 1689391488;
        const newContacts = {
          contact_ids: [111111111, 222222222],
          standing: 5.0,
          label_ids: [1],
        };
        const expectedIds = [111111111, 222222222];

        jest
          .spyOn(client.contacts, 'postCharacterContacts')
          .mockResolvedValue(expectedIds);

        // When: I add contacts
        const result = await client.contacts.postCharacterContacts(
          characterId,
          newContacts,
        );

        // Then: I should receive the IDs of the added contacts
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(2);
        expect(result).toContain(111111111);
        expect(result).toContain(222222222);
      });
    });
  });

  describe('Feature: Delete Contacts', () => {
    describe('Scenario: Remove contacts from a character contact list', () => {
      it('Given existing contact IDs, When I delete those contacts, Then the deletion should complete successfully', async () => {
        // Given: Existing contact IDs
        const characterId = 1689391488;
        const contactIds = [111111111, 222222222];

        jest
          .spyOn(client.contacts, 'deleteCharacterContacts')
          .mockResolvedValue(undefined);

        // When: I delete those contacts
        await client.contacts.deleteCharacterContacts(characterId, contactIds);

        // Then: The deletion should complete successfully
        expect(client.contacts.deleteCharacterContacts).toHaveBeenCalledWith(
          characterId,
          contactIds,
        );
      });
    });
  });

  describe('Feature: Corporation Contacts', () => {
    describe('Scenario: Get contacts for a corporation', () => {
      it('Given a valid corporation ID, When I request corporation contacts, Then I should receive the corporation contact list', async () => {
        // Given: A valid corporation ID
        const corporationId = 1344654522;
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

        // When: I request corporation contacts
        const result =
          await client.contacts.getCorporationContacts(corporationId);

        // Then: I should receive the corporation contact list
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('contact_id', 99005338);
        expect(result[0]).toHaveProperty('contact_type', 'alliance');
        expect(result[1]).toHaveProperty('standing', -5.0);
      });
    });

    describe('Scenario: Get corporation contact labels', () => {
      it('Given a corporation with custom labels, When I request corporation contact labels, Then I should receive the label definitions', async () => {
        // Given: A corporation with custom labels
        const corporationId = 1344654522;
        const expectedLabels = [
          { label_id: 1, label_name: 'War Target' },
          { label_id: 2, label_name: 'Ally' },
        ];

        jest
          .spyOn(client.contacts, 'getCorporationContactLabels')
          .mockResolvedValue(expectedLabels);

        // When: I request corporation contact labels
        const result =
          await client.contacts.getCorporationContactLabels(corporationId);

        // Then: I should receive the label definitions
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('label_name', 'War Target');
      });
    });
  });

  describe('Feature: Integration Workflows', () => {
    describe('Scenario: Complete contact management workflow - list, add, and verify', () => {
      it('Given a character managing contacts, When I list contacts then add new ones and verify, Then the full workflow should succeed', async () => {
        // Given: A character managing contacts
        const characterId = 1689391488;

        const initialContacts = [
          {
            contact_id: 123456789,
            contact_type: 'character' as const,
            standing: 10.0,
            label_ids: [],
          },
        ];

        const labels = [{ label_id: 1, label_name: 'Friendly' }];

        const newContactData = {
          contact_ids: [333333333],
          standing: 5.0,
          label_ids: [1],
        };

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

        // When: I list contacts, get labels, add new contacts, and verify
        const [contacts, contactLabels] = await Promise.all([
          client.contacts.getCharacterContacts(characterId),
          client.contacts.getCharacterContactLabels(characterId),
        ]);

        expect(contacts).toHaveLength(1);
        expect(contactLabels).toHaveLength(1);

        await client.contacts.postCharacterContacts(
          characterId,
          newContactData,
        );

        const finalContacts =
          await client.contacts.getCharacterContacts(characterId);

        // Then: The full workflow should succeed
        expect(finalContacts).toHaveLength(2);
        expect(finalContacts[1].contact_id).toBe(333333333);
        expect(finalContacts[1].standing).toBe(5.0);
      });
    });
  });
});
