import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import {
  RecordedRequest,
  createSeamClient,
  lastRequest,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature('tests/bdd/features/core/0035-ui.feature');

/** The query string of a recorded request as a plain object. */
const queryOf = (request: RecordedRequest): Record<string, string> =>
  Object.fromEntries(request.url.searchParams.entries());

/** ESI answers every accepted UI write with 204 and no body. */
const queueNoContent = (match: string): void =>
  queueResponse({ match, status: 204 });

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Waypoint appended to the existing route', ({ given, when, then }) => {
    let result: any;

    given('an authenticated character for waypoint', () => {
      queueNoContent('/ui/autopilot/waypoint');
    });

    when(
      'the client sets an autopilot waypoint to a solar system',
      async () => {
        result = await client.ui.setAutopilotWaypoint(30000142, false, false);
      },
    );

    then('the waypoint shall be set successfully', () => {
      expect(result).toBeUndefined();
      expect(sentRequests()).toHaveLength(1);
      const request = lastRequest();
      expect(request.method).toBe('POST');
      expect(request.url.pathname).toBe('/ui/autopilot/waypoint');
      expect(queryOf(request)).toEqual({
        destination_id: '30000142',
        add_to_beginning: 'false',
        clear_other_waypoints: 'false',
      });
      expect(request.headers.authorization).toBe('Bearer bdd-access-token');
      expect(request.body).toBeUndefined();
    });
  });

  test('Waypoint set with the clear-other-waypoints flag', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('an authenticated character with existing waypoints', () => {
      queueNoContent('/ui/autopilot/waypoint');
    });

    when('the client sets a waypoint with clear flag', async () => {
      result = await client.ui.setAutopilotWaypoint(30002187, false, true);
    });

    then('existing waypoints shall be cleared', () => {
      expect(result).toBeUndefined();
      expect(sentRequests()).toHaveLength(1);
      const request = lastRequest();
      expect(request.method).toBe('POST');
      expect(request.url.pathname).toBe('/ui/autopilot/waypoint');
      expect(queryOf(request)).toEqual({
        destination_id: '30002187',
        add_to_beginning: 'false',
        clear_other_waypoints: 'true',
      });
    });
  });

  test('Contract window opened for a contract identifier', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('an authenticated character for contracts', () => {
      queueNoContent('/ui/openwindow/contract');
    });

    when(
      'the client opens a contract window for a specific contract',
      async () => {
        result = await client.ui.openContractWindow(123456789);
      },
    );

    then('the contract window shall open successfully', () => {
      expect(result).toBeUndefined();
      expect(sentRequests()).toHaveLength(1);
      const request = lastRequest();
      expect(request.method).toBe('POST');
      expect(request.url.pathname).toBe('/ui/openwindow/contract');
      expect(queryOf(request)).toEqual({ contract_id: '123456789' });
      expect(request.headers.authorization).toBe('Bearer bdd-access-token');
    });
  });

  test('Information window opened for a character identifier', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('an authenticated character for info window', () => {
      queueNoContent('/ui/openwindow/information');
    });

    when('the client opens an info window for another character', async () => {
      result = await client.ui.openInformationWindow(1689391488);
    });

    then('the information window shall display successfully', () => {
      expect(result).toBeUndefined();
      expect(sentRequests()).toHaveLength(1);
      const request = lastRequest();
      expect(request.method).toBe('POST');
      expect(request.url.pathname).toBe('/ui/openwindow/information');
      expect(queryOf(request)).toEqual({ target_id: '1689391488' });
    });
  });

  test('Market details window opened for a type identifier', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('an authenticated character for market', () => {
      queueNoContent('/ui/openwindow/marketdetails');
    });

    when('the client opens the market details for an item type', async () => {
      result = await client.ui.openMarketDetailsWindow(34);
    });

    then('the market window shall display successfully', () => {
      expect(result).toBeUndefined();
      expect(sentRequests()).toHaveLength(1);
      const request = lastRequest();
      expect(request.method).toBe('POST');
      expect(request.url.pathname).toBe('/ui/openwindow/marketdetails');
      expect(queryOf(request)).toEqual({ type_id: '34' });
    });
  });

  test('Mail window opened with recipients, subject, and body', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const mailBody = {
      recipients: [1689391488],
      subject: 'Fleet Operation Tonight',
      body: 'Join us at 20:00 UTC for a fleet op.',
    };

    given('an authenticated character for mail', () => {
      queueNoContent('/ui/openwindow/newmail');
    });

    when(
      'the client opens a new mail window with recipients and content',
      async () => {
        result = await client.ui.openNewMailWindow(mailBody);
      },
    );

    then('the mail window shall display with pre-filled data', () => {
      expect(result).toBeUndefined();
      expect(sentRequests()).toHaveLength(1);
      const request = lastRequest();
      expect(request.method).toBe('POST');
      expect(request.url.pathname).toBe('/ui/openwindow/newmail');
      expect(queryOf(request)).toEqual({});
      expect(request.headers['content-type']).toBe('application/json');
      expect(request.headers.authorization).toBe('Bearer bdd-access-token');
      expect(JSON.parse(request.body!)).toEqual(mailBody);
    });
  });

  test('Unauthenticated waypoint request rejects with an EsiError', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('an unauthenticated user for waypoint', () => {
      queueError(
        403,
        'Token is not valid for scope(s): esi-ui.write_waypoint.v1',
        {
          match: '/ui/autopilot/waypoint',
        },
      );
    });

    when('the client attempts to set a waypoint', async () => {
      try {
        await client.ui.setAutopilotWaypoint(30000142, false, false);
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a 403 forbidden error for waypoint', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(403);
      // A POST is never retried, and 403 is not retryable in any case.
      expect(sentRequests()).toHaveLength(1);
      expect(lastRequest().method).toBe('POST');
    });
  });

  test('Unauthenticated contract window request rejects with an EsiError', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('an unauthenticated user for contracts', () => {
      queueError(
        403,
        'Token is not valid for scope(s): esi-ui.open_window.v1',
        {
          match: '/ui/openwindow/contract',
        },
      );
    });

    when('the client attempts to open a contract window', async () => {
      try {
        await client.ui.openContractWindow(123456789);
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a 403 forbidden error for contract', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(403);
      expect(sentRequests()).toHaveLength(1);
      expect(lastRequest().url.pathname).toBe('/ui/openwindow/contract');
    });
  });

  test('Five concurrent UI operations each issue exactly one request', ({
    given,
    when,
    then,
  }) => {
    let results: any[];
    const mailBody = {
      recipients: [1689391488],
      subject: 'Test',
      body: 'Test body',
    };

    given('an authenticated character for concurrent operations', () => {
      queueNoContent('/ui/autopilot/waypoint');
      queueNoContent('/ui/openwindow/contract');
      queueNoContent('/ui/openwindow/information');
      queueNoContent('/ui/openwindow/marketdetails');
      queueNoContent('/ui/openwindow/newmail');
    });

    when(
      'the client performs multiple UI operations concurrently',
      async () => {
        results = await Promise.all([
          client.ui.setAutopilotWaypoint(30000142, false, false),
          client.ui.openContractWindow(123456789),
          client.ui.openInformationWindow(1689391488),
          client.ui.openMarketDetailsWindow(34),
          client.ui.openNewMailWindow(mailBody),
        ]);
      },
    );

    then('all operations shall complete successfully', () => {
      expect(results).toEqual([
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      ]);

      const requests = sentRequests();
      expect(requests).toHaveLength(5);
      expect(requests.every((r) => r.method === 'POST')).toBe(true);

      const byPath = Object.fromEntries(
        requests.map((r) => [r.url.pathname, r]),
      );
      expect(Object.keys(byPath).sort()).toEqual([
        '/ui/autopilot/waypoint',
        '/ui/openwindow/contract',
        '/ui/openwindow/information',
        '/ui/openwindow/marketdetails',
        '/ui/openwindow/newmail',
      ]);
      expect(queryOf(byPath['/ui/autopilot/waypoint'])).toEqual({
        destination_id: '30000142',
        add_to_beginning: 'false',
        clear_other_waypoints: 'false',
      });
      expect(queryOf(byPath['/ui/openwindow/contract'])).toEqual({
        contract_id: '123456789',
      });
      expect(queryOf(byPath['/ui/openwindow/information'])).toEqual({
        target_id: '1689391488',
      });
      expect(queryOf(byPath['/ui/openwindow/marketdetails'])).toEqual({
        type_id: '34',
      });
      expect(JSON.parse(byPath['/ui/openwindow/newmail'].body!)).toEqual(
        mailBody,
      );
    });
  });
});
