import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/0035-ui.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-ui-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('Waypoint appended to the existing route', ({ given, when, then }) => {
    let result: any;
    given('an authenticated character for waypoint', () => {
      jest
        .spyOn(client.ui, 'setAutopilotWaypoint')
        .mockResolvedValue(undefined);
    });

    when(
      'the client sets an autopilot waypoint to a solar system',
      async () => {
        result = await client.ui.setAutopilotWaypoint(30000142, false, false);
      },
    );

    then('the waypoint shall be set successfully', () => {
      expect(result).toBeUndefined();
      expect(client.ui.setAutopilotWaypoint).toHaveBeenCalledWith(
        30000142,
        false,
        false,
      );
    });
  });

  test('Waypoint set with the clear-other-waypoints flag', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    given('an authenticated character with existing waypoints', () => {
      jest
        .spyOn(client.ui, 'setAutopilotWaypoint')
        .mockResolvedValue(undefined);
    });

    when('the client sets a waypoint with clear flag', async () => {
      result = await client.ui.setAutopilotWaypoint(30002187, false, true);
    });

    then('existing waypoints shall be cleared', () => {
      expect(result).toBeUndefined();
      expect(client.ui.setAutopilotWaypoint).toHaveBeenCalledWith(
        30002187,
        false,
        true,
      );
    });
  });

  test('Contract window opened for a contract identifier', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    given('an authenticated character for contracts', () => {
      jest.spyOn(client.ui, 'openContractWindow').mockResolvedValue(undefined);
    });

    when(
      'the client opens a contract window for a specific contract',
      async () => {
        result = await client.ui.openContractWindow(123456789);
      },
    );

    then('the contract window shall open successfully', () => {
      expect(result).toBeUndefined();
      expect(client.ui.openContractWindow).toHaveBeenCalledWith(123456789);
    });
  });

  test('Information window opened for a character identifier', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    given('an authenticated character for info window', () => {
      jest
        .spyOn(client.ui, 'openInformationWindow')
        .mockResolvedValue(undefined);
    });

    when('the client opens an info window for another character', async () => {
      result = await client.ui.openInformationWindow(1689391488);
    });

    then('the information window shall display successfully', () => {
      expect(result).toBeUndefined();
      expect(client.ui.openInformationWindow).toHaveBeenCalledWith(1689391488);
    });
  });

  test('Market details window opened for a type identifier', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    given('an authenticated character for market', () => {
      jest
        .spyOn(client.ui, 'openMarketDetailsWindow')
        .mockResolvedValue(undefined);
    });

    when('the client opens the market details for an item type', async () => {
      result = await client.ui.openMarketDetailsWindow(34);
    });

    then('the market window shall display successfully', () => {
      expect(result).toBeUndefined();
      expect(client.ui.openMarketDetailsWindow).toHaveBeenCalledWith(34);
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
      jest.spyOn(client.ui, 'openNewMailWindow').mockResolvedValue(undefined);
    });

    when(
      'the client opens a new mail window with recipients and content',
      async () => {
        result = await client.ui.openNewMailWindow(mailBody);
      },
    );

    then('the mail window shall display with pre-filled data', () => {
      expect(result).toBeUndefined();
      expect(client.ui.openNewMailWindow).toHaveBeenCalledWith(mailBody);
    });
  });

  test('Unauthenticated waypoint request rejects with an EsiError', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('an unauthenticated user for waypoint', () => {
      const forbiddenError = TestDataFactory.createError(403);

      jest
        .spyOn(client.ui, 'setAutopilotWaypoint')
        .mockRejectedValue(forbiddenError);
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
    });
  });

  test('Unauthenticated contract window request rejects with an EsiError', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('an unauthenticated user for contracts', () => {
      const forbiddenError = TestDataFactory.createError(403);

      jest
        .spyOn(client.ui, 'openContractWindow')
        .mockRejectedValue(forbiddenError);
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
    });
  });

  test('Five concurrent UI operations each issue exactly one request', ({
    given,
    when,
    then,
  }) => {
    let results: any[];

    given('an authenticated character for concurrent operations', () => {
      jest
        .spyOn(client.ui, 'setAutopilotWaypoint')
        .mockResolvedValue(undefined);
      jest.spyOn(client.ui, 'openContractWindow').mockResolvedValue(undefined);
      jest
        .spyOn(client.ui, 'openInformationWindow')
        .mockResolvedValue(undefined);
      jest
        .spyOn(client.ui, 'openMarketDetailsWindow')
        .mockResolvedValue(undefined);
      jest.spyOn(client.ui, 'openNewMailWindow').mockResolvedValue(undefined);
    });

    when(
      'the client performs multiple UI operations concurrently',
      async () => {
        results = await Promise.all([
          client.ui.setAutopilotWaypoint(30000142, false, false),
          client.ui.openContractWindow(123456789),
          client.ui.openInformationWindow(1689391488),
          client.ui.openMarketDetailsWindow(34),
          client.ui.openNewMailWindow({
            recipients: [1689391488],
            subject: 'Test',
            body: 'Test body',
          }),
        ]);
      },
    );

    then('all operations shall complete successfully', () => {
      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result).toBeUndefined();
      });

      expect(client.ui.setAutopilotWaypoint).toHaveBeenCalledTimes(1);
      expect(client.ui.openContractWindow).toHaveBeenCalledTimes(1);
      expect(client.ui.openInformationWindow).toHaveBeenCalledTimes(1);
      expect(client.ui.openMarketDetailsWindow).toHaveBeenCalledTimes(1);
      expect(client.ui.openNewMailWindow).toHaveBeenCalledTimes(1);
    });
  });
});
