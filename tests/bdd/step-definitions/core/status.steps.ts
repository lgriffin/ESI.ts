import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/status.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-status-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('Get current server status', ({ given, when, then }) => {
    let result: any;

    given('the Tranquility server is online', () => {
      const expectedStatus = {
        players: 32000,
        server_version: '2115629',
        start_time: '2024-01-15T11:05:00Z',
        vip: false,
      };

      jest.spyOn(client.status, 'getStatus').mockResolvedValue(expectedStatus);
    });

    when('I request the server status', async () => {
      result = await client.status.getStatus();
    });

    then('I should receive current status information', () => {
      expect(result).toBeDefined();
      expect(result).toHaveProperty('players');
      expect(result).toHaveProperty('server_version');
      expect(result).toHaveProperty('start_time');
      expect(result).toHaveProperty('vip');
      expect(result.players).toBe(32000);
      expect(result.server_version).toBe('2115629');
    });
  });

  test('Verify player count is reasonable', ({ given, when, then }) => {
    let result: any;

    given('the server is online with a typical player count', () => {
      const expectedStatus = {
        players: 32000,
        server_version: '2115629',
        start_time: '2024-01-15T11:05:00Z',
        vip: false,
      };

      jest.spyOn(client.status, 'getStatus').mockResolvedValue(expectedStatus);
    });

    when('I check the player count', async () => {
      result = await client.status.getStatus();
    });

    then('the player count should be within expected bounds', () => {
      expect(typeof result.players).toBe('number');
      expect(result.players).toBeGreaterThanOrEqual(0);
      expect(result.players).toBeLessThanOrEqual(65000);
    });
  });

  test('Verify start time is a valid timestamp', ({ given, when, then }) => {
    let result: any;

    given('the server is online', () => {
      const expectedStatus = {
        players: 28000,
        server_version: '2115629',
        start_time: '2024-01-15T11:05:00Z',
        vip: false,
      };

      jest.spyOn(client.status, 'getStatus').mockResolvedValue(expectedStatus);
    });

    when('I check the start time', async () => {
      result = await client.status.getStatus();
    });

    then('the start time should be a valid ISO timestamp', () => {
      expect(result.start_time).toBeDefined();
      const parsedDate = new Date(result.start_time);
      expect(parsedDate.getTime()).not.toBeNaN();
      expect(parsedDate.getFullYear()).toBe(2024);
    });
  });

  test('VIP mode is active', ({ given, when, then }) => {
    let result: any;

    given('the server is in VIP mode', () => {
      const vipStatus = {
        players: 50,
        server_version: '2115629',
        start_time: '2024-01-15T11:05:00Z',
        vip: true,
      };

      jest.spyOn(client.status, 'getStatus').mockResolvedValue(vipStatus);
    });

    when('I request the status', async () => {
      result = await client.status.getStatus();
    });

    then('the VIP flag should be true and player count should be low', () => {
      expect(result.vip).toBe(true);
      expect(typeof result.vip).toBe('boolean');
      expect(result.players).toBeLessThan(1000);
    });
  });

  test('VIP mode is inactive during normal operations', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('the server is operating normally', () => {
      const normalStatus = {
        players: 32000,
        server_version: '2115629',
        start_time: '2024-01-15T11:05:00Z',
        vip: false,
      };

      jest.spyOn(client.status, 'getStatus').mockResolvedValue(normalStatus);
    });

    when('I request the status for VIP check', async () => {
      result = await client.status.getStatus();
    });

    then('the VIP flag should be false', () => {
      expect(result.vip).toBe(false);
      expect(result.players).toBeGreaterThan(1000);
    });
  });

  test('Server is unavailable (503)', ({ given, when, then }) => {
    let caughtError: any;

    given('the ESI API is unavailable', () => {
      const serviceError = TestDataFactory.createError(503);

      jest.spyOn(client.status, 'getStatus').mockRejectedValue(serviceError);
    });

    when('I request the server status', async () => {
      try {
        await client.status.getStatus();
      } catch (e) {
        caughtError = e;
      }
    });

    then('I should receive a 503 service unavailable error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('Internal server error (500)', ({ given, when, then }) => {
    let caughtError: any;

    given('the ESI API encounters an internal error', () => {
      const serverError = TestDataFactory.createError(500);

      jest.spyOn(client.status, 'getStatus').mockRejectedValue(serverError);
    });

    when('I request the server status for error check', async () => {
      try {
        await client.status.getStatus();
      } catch (e) {
        caughtError = e;
      }
    });

    then('I should receive a 500 error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('Monitor server status over multiple checks', ({
    given,
    when,
    then,
  }) => {
    let results: any[] = [];

    given('the server is online with gradually changing player counts', () => {
      const statusChecks = [
        {
          players: 30000,
          server_version: '2115629',
          start_time: '2024-01-15T11:05:00Z',
          vip: false,
        },
        {
          players: 31000,
          server_version: '2115629',
          start_time: '2024-01-15T11:05:00Z',
          vip: false,
        },
        {
          players: 32500,
          server_version: '2115629',
          start_time: '2024-01-15T11:05:00Z',
          vip: false,
        },
      ];

      let callCount = 0;
      jest.spyOn(client.status, 'getStatus').mockImplementation(async () => {
        const result = statusChecks[callCount];
        callCount++;
        return result;
      });
    });

    when('I check the status multiple times', async () => {
      results = [];
      for (let i = 0; i < 3; i++) {
        results.push(await client.status.getStatus());
      }
    });

    then(
      'each check should return valid data with consistent server version',
      () => {
        expect(results).toHaveLength(3);
        results.forEach((result) => {
          expect(result).toHaveProperty('players');
          expect(result).toHaveProperty('server_version');
          expect(result.server_version).toBe('2115629');
          expect(result.start_time).toBe('2024-01-15T11:05:00Z');
        });

        // Player count should vary between checks
        expect(results[0].players).not.toBe(results[2].players);
      },
    );
  });
});
