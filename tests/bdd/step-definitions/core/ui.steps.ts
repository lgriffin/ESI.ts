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

  test('Set an autopilot waypoint', ({ given, when, then }) => {
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

    when('I set an autopilot waypoint to a solar system', async () => {
      result = await client.ui.setAutopilotWaypoint(waypointBody);
    });

    then('the waypoint should be set successfully', () => {
      expect(result).toBeUndefined();
      expect(client.ui.setAutopilotWaypoint).toHaveBeenCalledWith(waypointBody);
    });
  });

  test('Set a waypoint clearing existing route', ({ given, when, then }) => {
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

    when('I set a waypoint with clear flag', async () => {
      result = await client.ui.setAutopilotWaypoint(waypointBody);
    });

    then('existing waypoints should be cleared', () => {
      expect(result).toBeUndefined();
      expect(client.ui.setAutopilotWaypoint).toHaveBeenCalledWith(
        expect.objectContaining({ clear_other_waypoints: true }),
      );
    });
  });

  test('Open a contract window', ({ given, when, then }) => {
    let result: any;
    const contractBody = {
      contract_id: 123456789,
    };

    given('an authenticated character for contracts', () => {
      jest.spyOn(client.ui, 'openContractWindow').mockResolvedValue(undefined);
    });

    when('I open a contract window for a specific contract', async () => {
      result = await client.ui.openContractWindow(contractBody);
    });

    then('the contract window should open successfully', () => {
      expect(result).toBeUndefined();
      expect(client.ui.openContractWindow).toHaveBeenCalledWith(contractBody);
    });
  });

  test('Open an information window for a character', ({
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

    when('I open an info window for another character', async () => {
      result = await client.ui.openInformationWindow(infoBody);
    });

    then('the information window should display successfully', () => {
      expect(result).toBeUndefined();
      expect(client.ui.openInformationWindow).toHaveBeenCalledWith(infoBody);
    });
  });

  test('Open a market details window', ({ given, when, then }) => {
    let result: any;
    const marketBody = {
      type_id: 34,
    };

    given('an authenticated character for market', () => {
      jest
        .spyOn(client.ui, 'openMarketDetailsWindow')
        .mockResolvedValue(undefined);
    });

    when('I open the market details for an item type', async () => {
      result = await client.ui.openMarketDetailsWindow(marketBody);
    });

    then('the market window should display successfully', () => {
      expect(result).toBeUndefined();
      expect(client.ui.openMarketDetailsWindow).toHaveBeenCalledWith(
        marketBody,
      );
    });
  });

  test('Open a new mail window with pre-filled content', ({
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

    when('I open a new mail window with recipients and content', async () => {
      result = await client.ui.openNewMailWindow(mailBody);
    });

    then('the mail window should display with pre-filled data', () => {
      expect(result).toBeUndefined();
      expect(client.ui.openNewMailWindow).toHaveBeenCalledWith(mailBody);
    });
  });

  test('Unauthorized access to UI operations (403)', ({
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

    when('I attempt to set a waypoint', async () => {
      try {
        await client.ui.setAutopilotWaypoint({ destination_id: 30000142 });
      } catch (e) {
        caughtError = e;
      }
    });

    then('I should receive a 403 forbidden error for waypoint', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('Unauthorized access to contract window (403)', ({
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

    when('I attempt to open a contract window', async () => {
      try {
        await client.ui.openContractWindow({ contract_id: 123456789 });
      } catch (e) {
        caughtError = e;
      }
    });

    then('I should receive a 403 forbidden error for contract', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('Execute multiple UI operations simultaneously', ({
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

    when('I perform multiple UI operations concurrently', async () => {
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
    });

    then('all operations should complete successfully', () => {
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
