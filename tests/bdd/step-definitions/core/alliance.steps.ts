import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError, TimeoutError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';
import {
  RETRYABLE_ATTEMPTS,
  SEAM_RETRY,
  createSeamClient,
  lastRequest,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature('tests/bdd/features/core/0001-alliance.feature');

/** Matches the alliance record URL only, not its sub-resources. */
const allianceRecordPath = (allianceId: number) =>
  new RegExp(`/alliances/${allianceId}/(\\?|$)`);

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Alliance record for a known alliance ID', ({ given, when, then }) => {
    let result: any;
    const validAllianceId = 99005338;

    given('a valid alliance ID', () => {
      // ESI does not echo alliance_id in the record body.
      const { alliance_id: _omitted, ...record } =
        TestDataFactory.createAllianceInfo({
          name: 'Goonswarm Federation',
          ticker: 'CONDI',
          creator_id: 1689391488,
        });
      queueResponse({
        match: allianceRecordPath(validAllianceId),
        body: record,
      });
    });

    when('the client requests alliance details', async () => {
      result = await client.alliance.getAllianceById(validAllianceId);
    });

    then('the client shall return complete alliance information', () => {
      const request = lastRequest();
      expect(request.method).toBe('GET');
      expect(request.url.pathname).toMatch(
        new RegExp(`/alliances/${validAllianceId}/$`),
      );
      expect(result.name).toBe('Goonswarm Federation');
      expect(result.ticker).toBe('CONDI');
      expect(result.creator_id).toBe(1689391488);
      expect(result.creator_corporation_id).toBe(1344654522);
      expect(result.date_founded).toBe('2010-06-01T00:00:00Z');
    });
  });

  test('Unknown alliance ID rejects the request', ({ given, when, then }) => {
    const invalidAllianceId = 999999999;
    let error: any;

    given('an invalid alliance ID', () => {
      queueError(404, 'Alliance not found', {
        match: allianceRecordPath(invalidAllianceId),
      });
    });

    when(
      'the client requests alliance details for the invalid ID',
      async () => {
        try {
          await client.alliance.getAllianceById(invalidAllianceId);
        } catch (e) {
          error = e;
        }
      },
    );

    then('the client shall return a not found error', () => {
      expect(error).toBeInstanceOf(EsiError);
      expect((error as EsiError).statusCode).toBe(404);
      // 404 is not retryable: exactly one request goes out.
      expect(sentRequests()).toHaveLength(1);
    });
  });

  test('Transport failure rejects the request', ({ given, when, then }) => {
    const allianceId = 99005338;
    let error: any;

    given('network connectivity problems', () => {
      // The connection stalls past the client timeout on every attempt, so
      // no HTTP status ever reaches the client.
      client = createSeamClient({ timeout: 20 });
      queueResponse({
        match: allianceRecordPath(allianceId),
        body: TestDataFactory.createAllianceInfo(),
        delayMs: 200,
        times: RETRYABLE_ATTEMPTS,
      });
    });

    when(
      'the client requests alliance details during network issues',
      async () => {
        try {
          await client.alliance.getAllianceById(allianceId);
        } catch (e) {
          error = e;
        }
      },
    );

    then('the client shall return a network error', () => {
      expect(error).toBeInstanceOf(EsiError);
      expect(error).toBeInstanceOf(TimeoutError);
      expect((error as EsiError).statusCode).toBe(0);
      expect(sentRequests()).toHaveLength(RETRYABLE_ATTEMPTS);
    });
  });

  test('Contact list holding a character entry and a corporation entry', ({
    given,
    when,
    then,
  }) => {
    const allianceId = 99005338;
    let result: any;

    given('a valid alliance with contacts', () => {
      queueResponse({
        match: `/alliances/${allianceId}/contacts`,
        body: [
          TestDataFactory.createAllianceContact({
            contact_id: 1689391488,
            contact_type: 'character',
            standing: 10.0,
          }),
          TestDataFactory.createAllianceContact({
            contact_id: 1344654522,
            contact_type: 'corporation',
            standing: 5.0,
            label_ids: [3],
          }),
        ],
      });
    });

    when('the client requests contact list', async () => {
      result = await client.alliance.getContacts(allianceId);
    });

    then('the client shall return an array of contacts', () => {
      const request = lastRequest();
      expect(request.url.pathname).toMatch(
        new RegExp(`/alliances/${allianceId}/contacts$`),
      );
      expect(request.headers.authorization).toBe('Bearer bdd-access-token');
      expect(result).toEqual([
        {
          contact_id: 1689391488,
          contact_type: 'character',
          standing: 10.0,
          label_ids: [1, 2],
        },
        {
          contact_id: 1344654522,
          contact_type: 'corporation',
          standing: 5.0,
          label_ids: [3],
        },
      ]);
    });
  });

  test('Alliance holding no contacts', ({ given, when, then }) => {
    const allianceId = 99005338;
    let result: any;

    given('an alliance with no contacts', () => {
      queueResponse({
        match: `/alliances/${allianceId}/contacts`,
        body: [],
      });
    });

    when('the client requests contact list for the alliance', async () => {
      result = await client.alliance.getContacts(allianceId);
    });

    then('the client shall return an empty array', () => {
      expect(sentRequests()).toHaveLength(1);
      expect(result).toEqual([]);
    });
  });

  test('Rate limited response rejects the request', ({ given, when, then }) => {
    const allianceId = 99005338;
    let error: any;

    given('API rate limiting is active', () => {
      // A 429 blocks the rate-limit group for 60s before any retry, so this
      // client surfaces the first 429 instead of waiting out the block.
      client = createSeamClient({
        retryConfig: { ...SEAM_RETRY, maxRetries: 0 },
      });
      queueError(429, 'Too many requests', {
        match: allianceRecordPath(allianceId),
      });
    });

    when('the client makes a rate limited request', async () => {
      try {
        await client.alliance.getAllianceById(allianceId);
      } catch (e) {
        error = e;
      }
    });

    then('the client shall return appropriate rate limit errors', () => {
      expect(error).toBeInstanceOf(EsiError);
      expect((error as EsiError).statusCode).toBe(429);
      expect((error as EsiError).isRateLimited()).toBe(true);
      expect(sentRequests()).toHaveLength(1);
    });
  });

  test('Alliance details resolve inside the latency budget', ({
    given,
    when,
    then,
  }) => {
    const allianceId = 99005338;
    let result: any;
    let responseTime: number;

    given('normal API conditions', () => {
      queueResponse({
        match: allianceRecordPath(allianceId),
        body: TestDataFactory.createAllianceInfo({ name: 'Latency Alliance' }),
        delayMs: 100,
      });
    });

    when('the client requests alliance data', async () => {
      const startTime = Date.now();
      result = await client.alliance.getAllianceById(allianceId);
      const endTime = Date.now();
      responseTime = endTime - startTime;
    });

    then('the response shall be within acceptable time limits', () => {
      expect(result.name).toBe('Latency Alliance');
      expect(sentRequests()).toHaveLength(1);
      expect(responseTime).toBeLessThan(5000);
      // The 100ms server delay really passed through the pipeline.
      expect(responseTime).toBeGreaterThanOrEqual(90);
    });
  });

  test('Concurrent fetch of record, contacts, and member corporations', ({
    given,
    when,
    then,
  }) => {
    const allianceId = 99005338;
    let alliance: any;
    let contacts: any;
    let corporations: any;

    given('a valid alliance ID for information gathering', () => {
      queueResponse({
        match: `/alliances/${allianceId}/contacts`,
        body: [
          TestDataFactory.createAllianceContact({ contact_id: 2112625428 }),
        ],
      });
      queueResponse({
        match: `/alliances/${allianceId}/corporations/`,
        body: [1344654522, 1344654523],
      });
      queueResponse({
        match: allianceRecordPath(allianceId),
        body: TestDataFactory.createAllianceInfo({ ticker: 'CONDI' }),
      });
    });

    when('the client gathers complete alliance information', async () => {
      [alliance, contacts, corporations] = await Promise.all([
        client.alliance.getAllianceById(allianceId),
        client.alliance.getContacts(allianceId),
        client.alliance.getCorporations(allianceId),
      ]);
    });

    then('the client shall successfully retrieve all related data', () => {
      expect(sentRequests()).toHaveLength(3);
      expect(alliance.ticker).toBe('CONDI');
      expect(contacts.map((c: any) => c.contact_id)).toEqual([2112625428]);
      expect(corporations).toEqual([1344654522, 1344654523]);
      for (const corporationId of corporations) {
        expect(typeof corporationId).toBe('number');
      }
    });
  });
});
