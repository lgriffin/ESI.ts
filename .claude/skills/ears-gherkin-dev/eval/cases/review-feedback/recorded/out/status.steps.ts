// tests/bdd/step-definitions/core/status.steps.ts after review (esi-7tw).
// Responses are queued at the transport seam instead of spying on getStatus,
// so the request pipeline and schema validation run for real.
import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { queueResponse } from '../../support';

const feature = loadFeature('tests/bdd/features/core/0034-status.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-status-client',
      baseUrl: 'https://esi.evetech.net',
      retryConfig: { maxRetries: 0 },
    });
  });

  test('Restricted login reports the VIP flag set', ({ given, when, then }) => {
    let result: { vip?: boolean };

    given('the server is in VIP mode', () => {
      queueResponse({
        status: 200,
        body: {
          players: 12,
          server_version: '2115629',
          start_time: '2026-09-16T11:05:00Z',
          vip: true,
        },
      });
    });

    when('the client requests the status', async () => {
      result = await client.status.getStatus();
    });

    then('the VIP flag shall be the boolean true', () => {
      expect(typeof result.vip).toBe('boolean');
      expect(result.vip).toBe(true);
    });
  });

  test('Service unavailable rejects the status request', ({
    given,
    when,
    then,
  }) => {
    let error: unknown;

    given('the ESI API is unavailable', () => {
      queueResponse({ status: 503, body: { error: 'Service Unavailable' } });
    });

    when('the client requests the status', async () => {
      error = await client.status.getStatus().catch((e) => e);
    });

    then('the client shall reject with an EsiError of status 503', () => {
      expect(error).toBeInstanceOf(EsiError);
      expect((error as EsiError).statusCode).toBe(503);
    });
  });
});
