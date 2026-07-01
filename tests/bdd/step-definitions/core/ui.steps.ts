import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/ui.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-ui-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('WHEN setting an autopilot waypoint, the client shall complete the operation', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const waypointBody = {
      destination_id: 30000142,
      add_to_beginning: false,
      clear_other_waypoints: false,
    };

    given('an authenticated character for waypoint', () => {
      jest
        .spyOn(client.ui, 'setAutopilotWaypoint')
        .mockResolvedValue(undefined);
    });

    when(
      'the client sets an autopilot waypoint to a solar system',
      async () => {
        result = await client.ui.setAutopilotWaypoint(waypointBody);
      },
    );

    then('the waypoint shall be set successfully', () => {
      expect(result).toBeUndefined();
      expect(client.ui.setAutopilotWaypoint).toHaveBeenCalledWith(waypointBody);
    });
  });

  test('WHEN setting a waypoint clearing existing route, the client shall complete the operation', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const waypointBody = {
      destination_id: 30002187,
      add_to_beginning: false,
      clear_other_waypoints: true,
    };

    given('an authenticated character with existing waypoints', () => {
      jest
        .spyOn(client.ui, 'setAutopilotWaypoint')
        .mockResolvedValue(undefined);
    });

    when('the client sets a waypoint with clear flag', async () => {
      result = await client.ui.setAutopilotWaypoint(waypointBody);
    });

    then('existing waypoints shall be cleared', () => {
      expect(result).toBeUndefined();
      expect(client.ui.setAutopilotWaypoint).toHaveBeenCalledWith(
        expect.objectContaining({ clear_other_waypoints: true }),
      );
    });
  });

  test('WHEN opening a contract window, the client shall complete the operation', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const contractBody = {
      contract_id: 123456789,
    };

    given('an authenticated character for contracts', () => {
      jest.spyOn(client.ui, 'openContractWindow').mockResolvedValue(undefined);
    });

    when(
      'the client opens a contract window for a specific contract',
      async () => {
        result = await client.ui.openContractWindow(contractBody);
      },
    );

    then('the contract window shall open successfully', () => {
      expect(result).toBeUndefined();
      expect(client.ui.openContractWindow).toHaveBeenCalledWith(contractBody);
    });
  });

  test('WHEN opening an information window for a character, the client shall complete the operation', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const infoBody = {
      target_id: 1689391488,
    };

    given('an authenticated character for info window', () => {
      jest
        .spyOn(client.ui, 'openInformationWindow')
        .mockResolvedValue(undefined);
    });

    when('the client opens an info window for another character', async () => {
      result = await client.ui.openInformationWindow(infoBody);
    });

    then('the information window shall display successfully', () => {
      expect(result).toBeUndefined();
      expect(client.ui.openInformationWindow).toHaveBeenCalledWith(infoBody);
    });
  });

  test('WHEN opening a market details window, the client shall complete the operation', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const marketBody = {
      type_id: 34,
    };

    given('an authenticated character for market', () => {
      jest
        .spyOn(client.ui, 'openMarketDetailsWindow')
        .mockResolvedValue(undefined);
    });

    when('the client opens the market details for an item type', async () => {
      result = await client.ui.openMarketDetailsWindow(marketBody);
    });

    then('the market window shall display successfully', () => {
      expect(result).toBeUndefined();
      expect(client.ui.openMarketDetailsWindow).toHaveBeenCalledWith(
        marketBody,
      );
    });
  });

  test('WHEN opening a new mail window with pre-filled content, the client shall complete the operation', ({
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

  test('IF unauthorized access to UI operations (403), THEN the client shall return a forbidden error', ({
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
        await client.ui.setAutopilotWaypoint({ destination_id: 30000142 });
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a 403 forbidden error for waypoint', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('IF unauthorized access to contract window (403), THEN the client shall return a forbidden error', ({
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
        await client.ui.openContractWindow({ contract_id: 123456789 });
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a 403 forbidden error for contract', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('WHEN executing multiple UI operations simultaneously, the client shall complete all operations', ({
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
          client.ui.setAutopilotWaypoint({ destination_id: 30000142 }),
          client.ui.openContractWindow({ contract_id: 123456789 }),
          client.ui.openInformationWindow({ target_id: 1689391488 }),
          client.ui.openMarketDetailsWindow({ type_id: 34 }),
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
