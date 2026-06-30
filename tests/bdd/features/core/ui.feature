Feature: UI Management

  Scenario: Set an autopilot waypoint
    Given an authenticated character for waypoint
    When I set an autopilot waypoint to a solar system
    Then the waypoint should be set successfully

  Scenario: Set a waypoint clearing existing route
    Given an authenticated character with existing waypoints
    When I set a waypoint with clear flag
    Then existing waypoints should be cleared

  Scenario: Open a contract window
    Given an authenticated character for contracts
    When I open a contract window for a specific contract
    Then the contract window should open successfully

  Scenario: Open an information window for a character
    Given an authenticated character for info window
    When I open an info window for another character
    Then the information window should display successfully

  Scenario: Open a market details window
    Given an authenticated character for market
    When I open the market details for an item type
    Then the market window should display successfully

  Scenario: Open a new mail window with pre-filled content
    Given an authenticated character for mail
    When I open a new mail window with recipients and content
    Then the mail window should display with pre-filled data

  Scenario: Unauthorized access to UI operations (403)
    Given an unauthenticated user for waypoint
    When I attempt to set a waypoint
    Then I should receive a 403 forbidden error for waypoint

  Scenario: Unauthorized access to contract window (403)
    Given an unauthenticated user for contracts
    When I attempt to open a contract window
    Then I should receive a 403 forbidden error for contract

  Scenario: Execute multiple UI operations simultaneously
    Given an authenticated character for concurrent operations
    When I perform multiple UI operations concurrently
    Then all operations should complete successfully
