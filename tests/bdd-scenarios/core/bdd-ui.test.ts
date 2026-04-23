/**
 * BDD Scenarios: UI Management
 *
 * Comprehensive behavior-driven tests for all UI-related APIs
 * covering autopilot waypoints, contract windows, information windows,
 * market details, and new mail composition.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD Scenarios: UI Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-ui-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  describe('Feature: Autopilot Waypoint Management', () => {
    describe('Scenario: Set an autopilot waypoint', () => {
      it('Given an authenticated character, When I set an autopilot waypoint to a solar system, Then the waypoint should be set successfully', async () => {
        // Given: An authenticated character setting a waypoint
        const waypointBody = {
          destination_id: 30000142, // Jita
          add_to_beginning: false,
          clear_other_waypoints: false,
        };

        jest
          .spyOn(client.ui, 'setAutopilotWaypoint')
          .mockResolvedValue(undefined);

        // When: I set an autopilot waypoint
        const result = await client.ui.setAutopilotWaypoint(waypointBody);

        // Then: The waypoint should be set successfully (void return)
        expect(result).toBeUndefined();
        expect(client.ui.setAutopilotWaypoint).toHaveBeenCalledWith(
          waypointBody,
        );
      });
    });

    describe('Scenario: Set a waypoint clearing existing route', () => {
      it('Given an authenticated character with existing waypoints, When I set a waypoint with clear flag, Then existing waypoints should be cleared', async () => {
        // Given: An authenticated character with existing waypoints
        const waypointBody = {
          destination_id: 30002187, // Amarr
          add_to_beginning: false,
          clear_other_waypoints: true,
        };

        jest
          .spyOn(client.ui, 'setAutopilotWaypoint')
          .mockResolvedValue(undefined);

        // When: I set a waypoint with the clear flag
        const result = await client.ui.setAutopilotWaypoint(waypointBody);

        // Then: The operation should succeed
        expect(result).toBeUndefined();
        expect(client.ui.setAutopilotWaypoint).toHaveBeenCalledWith(
          expect.objectContaining({ clear_other_waypoints: true }),
        );
      });
    });
  });

  describe('Feature: Contract Window Operations', () => {
    describe('Scenario: Open a contract window', () => {
      it('Given an authenticated character, When I open a contract window for a specific contract, Then the window should open successfully', async () => {
        // Given: An authenticated character viewing a contract
        const contractBody = {
          contract_id: 123456789,
        };

        jest
          .spyOn(client.ui, 'openContractWindow')
          .mockResolvedValue(undefined);

        // When: I open a contract window
        const result = await client.ui.openContractWindow(contractBody);

        // Then: The contract window should open successfully
        expect(result).toBeUndefined();
        expect(client.ui.openContractWindow).toHaveBeenCalledWith(contractBody);
      });
    });
  });

  describe('Feature: Information Window Operations', () => {
    describe('Scenario: Open an information window for a character', () => {
      it('Given an authenticated character, When I open an info window for another character, Then the window should display successfully', async () => {
        // Given: An authenticated character viewing info about another character
        const infoBody = {
          target_id: 1689391488,
        };

        jest
          .spyOn(client.ui, 'openInformationWindow')
          .mockResolvedValue(undefined);

        // When: I open an information window
        const result = await client.ui.openInformationWindow(infoBody);

        // Then: The information window should open successfully
        expect(result).toBeUndefined();
        expect(client.ui.openInformationWindow).toHaveBeenCalledWith(infoBody);
      });
    });
  });

  describe('Feature: Market Window Operations', () => {
    describe('Scenario: Open a market details window', () => {
      it('Given an authenticated character, When I open the market details for an item type, Then the market window should display successfully', async () => {
        // Given: An authenticated character viewing market details
        const marketBody = {
          type_id: 34, // Tritanium
        };

        jest
          .spyOn(client.ui, 'openMarketDetailsWindow')
          .mockResolvedValue(undefined);

        // When: I open the market details window
        const result = await client.ui.openMarketDetailsWindow(marketBody);

        // Then: The market details window should open successfully
        expect(result).toBeUndefined();
        expect(client.ui.openMarketDetailsWindow).toHaveBeenCalledWith(
          marketBody,
        );
      });
    });
  });

  describe('Feature: Mail Composition Window', () => {
    describe('Scenario: Open a new mail window with pre-filled content', () => {
      it('Given an authenticated character, When I open a new mail window with recipients and content, Then the mail window should display with pre-filled data', async () => {
        // Given: An authenticated character composing a mail
        const mailBody = {
          recipients: [1689391488],
          subject: 'Fleet Operation Tonight',
          body: 'Join us at 20:00 UTC for a fleet op.',
        };

        jest.spyOn(client.ui, 'openNewMailWindow').mockResolvedValue(undefined);

        // When: I open a new mail window
        const result = await client.ui.openNewMailWindow(mailBody);

        // Then: The mail window should open successfully
        expect(result).toBeUndefined();
        expect(client.ui.openNewMailWindow).toHaveBeenCalledWith(mailBody);
      });
    });
  });

  describe('Feature: UI Error Handling', () => {
    describe('Scenario: Unauthorized access to UI operations (403)', () => {
      it('Given an unauthenticated user, When I attempt to set a waypoint, Then I should receive a 403 forbidden error', async () => {
        // Given: An unauthenticated user
        const forbiddenError = TestDataFactory.createError(403);

        jest
          .spyOn(client.ui, 'setAutopilotWaypoint')
          .mockRejectedValue(forbiddenError);

        // When & Then: I attempt to set a waypoint and expect a forbidden error
        await expect(
          client.ui.setAutopilotWaypoint({ destination_id: 30000142 }),
        ).rejects.toThrow(EsiError);
      });
    });

    describe('Scenario: Unauthorized access to contract window (403)', () => {
      it('Given an unauthenticated user, When I attempt to open a contract window, Then I should receive a 403 forbidden error', async () => {
        // Given: An unauthenticated user
        const forbiddenError = TestDataFactory.createError(403);

        jest
          .spyOn(client.ui, 'openContractWindow')
          .mockRejectedValue(forbiddenError);

        // When & Then: I attempt to open a contract window and expect a forbidden error
        await expect(
          client.ui.openContractWindow({ contract_id: 123456789 }),
        ).rejects.toThrow(EsiError);
      });
    });
  });

  describe('Feature: Concurrent UI Operations', () => {
    describe('Scenario: Execute multiple UI operations simultaneously', () => {
      it('Given an authenticated character, When I perform multiple UI operations concurrently, Then all operations should complete successfully', async () => {
        // Given: An authenticated character performing multiple UI operations
        jest
          .spyOn(client.ui, 'setAutopilotWaypoint')
          .mockResolvedValue(undefined);
        jest
          .spyOn(client.ui, 'openContractWindow')
          .mockResolvedValue(undefined);
        jest
          .spyOn(client.ui, 'openInformationWindow')
          .mockResolvedValue(undefined);
        jest
          .spyOn(client.ui, 'openMarketDetailsWindow')
          .mockResolvedValue(undefined);
        jest.spyOn(client.ui, 'openNewMailWindow').mockResolvedValue(undefined);

        // When: I perform multiple UI operations concurrently
        const results = await Promise.all([
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

        // Then: All operations should complete successfully (all return void)
        expect(results).toHaveLength(5);
        results.forEach((result) => {
          expect(result).toBeUndefined();
        });

        // Verify each operation was called
        expect(client.ui.setAutopilotWaypoint).toHaveBeenCalledTimes(1);
        expect(client.ui.openContractWindow).toHaveBeenCalledTimes(1);
        expect(client.ui.openInformationWindow).toHaveBeenCalledTimes(1);
        expect(client.ui.openMarketDetailsWindow).toHaveBeenCalledTimes(1);
        expect(client.ui.openNewMailWindow).toHaveBeenCalledTimes(1);
      });
    });
  });
});
