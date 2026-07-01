Feature: UI Management

  # EARS: Event-driven
  Scenario: WHEN setting an autopilot waypoint, the client shall complete the operation
    Given an authenticated character for waypoint
    When the client sets an autopilot waypoint to a solar system
    Then the waypoint shall be set successfully

  # EARS: Event-driven
  Scenario: WHEN setting a waypoint clearing existing route, the client shall complete the operation
    Given an authenticated character with existing waypoints
    When the client sets a waypoint with clear flag
    Then existing waypoints shall be cleared

  # EARS: Event-driven
  Scenario: WHEN opening a contract window, the client shall complete the operation
    Given an authenticated character for contracts
    When the client opens a contract window for a specific contract
    Then the contract window shall open successfully

  # EARS: Event-driven
  Scenario: WHEN opening an information window for a character, the client shall complete the operation
    Given an authenticated character for info window
    When the client opens an info window for another character
    Then the information window shall display successfully

  # EARS: Event-driven
  Scenario: WHEN opening a market details window, the client shall complete the operation
    Given an authenticated character for market
    When the client opens the market details for an item type
    Then the market window shall display successfully

  # EARS: Event-driven
  Scenario: WHEN opening a new mail window with pre-filled content, the client shall complete the operation
    Given an authenticated character for mail
    When the client opens a new mail window with recipients and content
    Then the mail window shall display with pre-filled data

  # EARS: Unwanted
  Scenario: IF unauthorized access to UI operations (403), THEN the client shall return a forbidden error
    Given an unauthenticated user for waypoint
    When the client attempts to set a waypoint
    Then the client shall return a 403 forbidden error for waypoint

  # EARS: Unwanted
  Scenario: IF unauthorized access to contract window (403), THEN the client shall return a forbidden error
    Given an unauthenticated user for contracts
    When the client attempts to open a contract window
    Then the client shall return a 403 forbidden error for contract

  # EARS: Event-driven
  Scenario: WHEN executing multiple UI operations simultaneously, the client shall complete all operations
    Given an authenticated character for concurrent operations
    When the client performs multiple UI operations concurrently
    Then all operations shall complete successfully
