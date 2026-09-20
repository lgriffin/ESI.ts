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

const feature = loadFeature('tests/bdd/features/core/0034-status.feature');

const STATUS_PATH = /\/status\/?(\?.*)?$/;

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Online server returns all four status fields', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('the Tranquility server is online', () => {
      queueResponse({
        match: STATUS_PATH,
        body: {
          players: 32000,
          server_version: '2115629',
          start_time: '2024-01-15T11:05:00Z',
          vip: false,
        },
      });
    });

    when('the client requests the server status', async () => {
      result = await client.status.getStatus();
    });

    then('the client shall return current status information', () => {
      const request = lastRequest();
      expect(request.method).toBe('GET');
      expect(request.url.pathname).toMatch(/\/status\/?$/);
      // Status is public: no bearer token is sent.
      expect(request.headers['authorization']).toBeUndefined();
      expect(result).toEqual({
        players: 32000,
        server_version: '2115629',
        start_time: '2024-01-15T11:05:00Z',
        vip: false,
      });
    });
  });

  test('Player count is a non-negative number', ({ given, when, then }) => {
    let result: any;

    given('the server is online with a typical player count', () => {
      queueResponse({
        match: STATUS_PATH,
        body: {
          players: 21874,
          server_version: '2115629',
          start_time: '2024-01-15T11:05:00Z',
          vip: false,
        },
      });
    });

    when('the client checks the player count', async () => {
      result = await client.status.getStatus();
    });

    then('the player count shall be within expected bounds', () => {
      expect(typeof result.players).toBe('number');
      expect(result.players).toBe(21874);
      expect(result.players).toBeGreaterThanOrEqual(0);
      expect(result.players).toBeLessThanOrEqual(65000);
    });
  });

  test('Start time parses as a calendar date', ({ given, when, then }) => {
    let result: any;

    given('the server is online', () => {
      queueResponse({
        match: STATUS_PATH,
        body: {
          players: 28000,
          server_version: '2115629',
          start_time: '2024-01-15T11:05:00Z',
          vip: false,
        },
      });
    });

    when('the client checks the start time', async () => {
      result = await client.status.getStatus();
    });

    then('the start time shall be a valid ISO timestamp', () => {
      expect(result.start_time).toBe('2024-01-15T11:05:00Z');
      const parsedDate = new Date(result.start_time);
      expect(parsedDate.getTime()).toBe(Date.UTC(2024, 0, 15, 11, 5, 0));
    });
  });

  test('Restricted login reports the VIP flag set with a low player count', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('the server is in VIP mode', () => {
      queueResponse({
        match: STATUS_PATH,
        body: {
          players: 50,
          server_version: '2115629',
          start_time: '2024-01-15T11:05:00Z',
          vip: true,
        },
      });
    });

    when('the client requests the status', async () => {
      result = await client.status.getStatus();
    });

    then('the VIP flag should be true and player count shall be low', () => {
      expect(result.vip).toBe(true);
      expect(result.players).toBe(50);
    });
  });

  test('Open login reports the VIP flag clear with a full player count', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('the server is operating normally', () => {
      queueResponse({
        match: STATUS_PATH,
        body: {
          players: 32000,
          server_version: '2115629',
          start_time: '2024-01-15T11:05:00Z',
          vip: false,
        },
      });
    });

    when('the client requests the status for VIP check', async () => {
      result = await client.status.getStatus();
    });

    then('the VIP flag shall be false', () => {
      expect(result.vip).toBe(false);
      expect(result.players).toBe(32000);
    });
  });

  test('Service unavailable rejects the status request with an EsiError', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('the ESI API is unavailable', () => {
      // 503 is retryable, so the outage has to outlast the retry budget.
      queueError(503, 'Service Unavailable', {
        match: STATUS_PATH,
        times: RETRYABLE_ATTEMPTS,
      });
    });

    when('the client requests the server status', async () => {
      try {
        await client.status.getStatus();
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a 503 service unavailable error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(503);
      expect(sentRequests()).toHaveLength(RETRYABLE_ATTEMPTS);
    });
  });

  test('Internal server error rejects the status request with an EsiError', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('the ESI API encounters an internal error', () => {
      queueError(500, 'Internal server error', { match: STATUS_PATH });
    });

    when('the client requests the server status for error check', async () => {
      try {
        await client.status.getStatus();
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a 500 error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(500);
      // 500 is not retried.
      expect(sentRequests()).toHaveLength(1);
    });
  });

  test('Three successive polls track a changing player count under one server version', ({
    given,
    when,
    then,
  }) => {
    let results: any[] = [];

    given('the server is online with gradually changing player counts', () => {
      // Served in order, one per poll.
      for (const players of [30000, 31000, 32500]) {
        queueResponse({
          match: STATUS_PATH,
          body: {
            players,
            server_version: '2115629',
            start_time: '2024-01-15T11:05:00Z',
            vip: false,
          },
        });
      }
    });

    when('the client checks the status multiple times', async () => {
      results = [];
      for (let i = 0; i < 3; i++) {
        results.push(await client.status.getStatus());
      }
    });

    then(
      'each check shall return valid data with consistent server version',
      () => {
        expect(sentRequests()).toHaveLength(3);
        expect(results.map((r) => r.players)).toEqual([30000, 31000, 32500]);
        results.forEach((result) => {
          expect(result.server_version).toBe('2115629');
          expect(result.start_time).toBe('2024-01-15T11:05:00Z');
        });
      },
    );
  });
});
