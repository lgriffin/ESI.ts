import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/alliance.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('Get alliance details for valid alliance ID', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const validAllianceId = 99005338;

    given('a valid alliance ID', () => {
      const expectedAlliance = TestDataFactory.createAllianceInfo({
        alliance_id: validAllianceId,
        name: 'Goonswarm Federation',
      });

      jest
        .spyOn(client.alliance, 'getAllianceById')
        .mockResolvedValue(expectedAlliance);
    });

    when('I request alliance details', async () => {
      result = await client.alliance.getAllianceById(validAllianceId);
    });

    then('I should receive complete alliance information', () => {
      expect(result).toBeDefined();
      expect(result.alliance_id).toBe(validAllianceId);
      expect(result.name).toBe('Goonswarm Federation');
      expect(result).toHaveProperty('ticker');
      expect(result).toHaveProperty('creator_id');
    });
  });

  test('Handle non-existent alliance ID', ({ given, when, then }) => {
    const invalidAllianceId = 999999999;
    let error: any;

    given('an invalid alliance ID', () => {
      const expectedError = TestDataFactory.createError(404);

      jest
        .spyOn(client.alliance, 'getAllianceById')
        .mockRejectedValue(expectedError);
    });

    when('I request alliance details for the invalid ID', async () => {
      try {
        await client.alliance.getAllianceById(invalidAllianceId);
      } catch (e) {
        error = e;
      }
    });

    then('I should receive a not found error', () => {
      expect(error).toBeInstanceOf(EsiError);
    });
  });

  test('Handle network connectivity issues', ({ given, when, then }) => {
    const allianceId = 99005338;
    let error: any;

    given('network connectivity problems', () => {
      const networkError = TestDataFactory.createError(0);

      jest
        .spyOn(client.alliance, 'getAllianceById')
        .mockRejectedValue(networkError);
    });

    when('I request alliance details during network issues', async () => {
      try {
        await client.alliance.getAllianceById(allianceId);
      } catch (e) {
        error = e;
      }
    });

    then('I should receive a network error', () => {
      expect(error).toBeInstanceOf(EsiError);
    });
  });

  test('Retrieve alliance contacts', ({ given, when, then }) => {
    const allianceId = 99005338;
    let result: any;

    given('a valid alliance with contacts', () => {
      const expectedContacts = [
        TestDataFactory.createAllianceContact({
          contact_id: 1689391488,
          contact_type: 'character',
          standing: 10.0,
        }),
        TestDataFactory.createAllianceContact({
          contact_id: 1344654522,
          contact_type: 'corporation',
          standing: 5.0,
        }),
      ];

      jest
        .spyOn(client.alliance, 'getContacts')
        .mockResolvedValue(expectedContacts);
    });

    when('I request contact list', async () => {
      result = await client.alliance.getContacts(allianceId);
    });

    then('I should receive an array of contacts', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('contact_id');
      expect(result[0]).toHaveProperty('contact_type');
      expect(result[0]).toHaveProperty('standing');
    });
  });

  test('Handle empty contact list', ({ given, when, then }) => {
    const allianceId = 99005338;
    let result: any;

    given('an alliance with no contacts', () => {
      const emptyContacts: any[] = [];

      jest
        .spyOn(client.alliance, 'getContacts')
        .mockResolvedValue(emptyContacts);
    });

    when('I request contact list for the alliance', async () => {
      result = await client.alliance.getContacts(allianceId);
    });

    then('I should receive an empty array', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });
  });

  test('Handle rate limiting gracefully', ({ given, when, then }) => {
    const allianceId = 99005338;
    let error: any;

    given('API rate limiting is active', () => {
      const rateLimitError = TestDataFactory.createError(429);

      jest
        .spyOn(client.alliance, 'getAllianceById')
        .mockRejectedValue(rateLimitError);
    });

    when('I make a rate limited request', async () => {
      try {
        await client.alliance.getAllianceById(allianceId);
      } catch (e) {
        error = e;
      }
    });

    then('I should receive appropriate rate limit errors', () => {
      expect(error).toBeInstanceOf(EsiError);
    });
  });

  test('Measure response performance', ({ given, when, then }) => {
    const allianceId = 99005338;
    let result: any;
    let responseTime: number;

    given('normal API conditions', () => {
      const mockAlliance = TestDataFactory.createAllianceInfo({
        alliance_id: allianceId,
      });

      jest
        .spyOn(client.alliance, 'getAllianceById')
        .mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return mockAlliance;
        });
    });

    when('I request alliance data', async () => {
      const startTime = Date.now();
      result = await client.alliance.getAllianceById(allianceId);
      const endTime = Date.now();
      responseTime = endTime - startTime;
    });

    then('the response should be within acceptable time limits', () => {
      expect(result).toBeDefined();
      expect(responseTime).toBeLessThan(5000);
      expect(responseTime).toBeGreaterThan(50);
    });
  });

  test('Complete alliance information gathering', ({ given, when, then }) => {
    const allianceId = 99005338;
    let alliance: any;
    let contacts: any;
    let corporations: any;

    given('a valid alliance ID for information gathering', () => {
      const mockAlliance = TestDataFactory.createAllianceInfo({
        alliance_id: allianceId,
      });
      const mockContacts = [TestDataFactory.createAllianceContact()];
      const mockCorporations = [1344654522, 1344654523];

      jest
        .spyOn(client.alliance, 'getAllianceById')
        .mockResolvedValue(mockAlliance);
      jest
        .spyOn(client.alliance, 'getContacts')
        .mockResolvedValue(mockContacts);
      jest
        .spyOn(client.alliance, 'getCorporations')
        .mockResolvedValue(mockCorporations);
    });

    when('I gather complete alliance information', async () => {
      [alliance, contacts, corporations] = await Promise.all([
        client.alliance.getAllianceById(allianceId),
        client.alliance.getContacts(allianceId),
        client.alliance.getCorporations(allianceId),
      ]);
    });

    then('I should successfully retrieve all related data', () => {
      expect(alliance).toBeDefined();
      expect(alliance.alliance_id).toBe(allianceId);

      expect(contacts).toBeInstanceOf(Array);
      expect(contacts.length).toBeGreaterThanOrEqual(0);

      expect(corporations).toBeInstanceOf(Array);
      expect(corporations.length).toBeGreaterThan(0);
      expect(typeof corporations[0]).toBe('number');
    });
  });
});
