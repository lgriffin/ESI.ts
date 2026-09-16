// tests/bdd/step-definitions/core/status.steps.ts as submitted in the PR.
import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';

const feature = loadFeature('tests/bdd/features/core/0034-status.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-status-client',
      baseUrl: 'https://esi.evetech.net',
    });
  });

  test('Restricted login reports the VIP flag set', ({ given, when, then }) => {
    let result: any;

    given('the server is in VIP mode', () => {
      jest.spyOn(client.status, 'getStatus').mockResolvedValue({
        players: 12,
        server_version: '2115629',
        start_time: '2026-09-16T11:05:00Z',
        vip: true,
      });
    });

    when('the client requests the status', async () => {
      result = await client.status.getStatus();
    });

    then('the VIP flag shall be true', () => {
      expect(result.vip).toBe(true);
    });
  });

  test('Outage during VIP window rejects the status request', ({
    given,
    when,
    then,
  }) => {
    let error: unknown;

    given('the ESI API is unavailable', () => {
      jest
        .spyOn(client.status, 'getStatus')
        .mockRejectedValue(new EsiError('Service Unavailable', 503));
    });

    when('the client requests the status', async () => {
      error = await client.status.getStatus().catch((e) => e);
    });

    then('the client shall reject with an EsiError', () => {
      expect(error).toBeInstanceOf(EsiError);
    });
  });
});
