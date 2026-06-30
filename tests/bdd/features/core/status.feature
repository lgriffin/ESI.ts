Feature: Status Management

  Scenario: Get current server status
    Given the Tranquility server is online
    When I request the server status
    Then I should receive current status information

  Scenario: Verify player count is reasonable
    Given the server is online with a typical player count
    When I check the player count
    Then the player count should be within expected bounds

  Scenario: Verify start time is a valid timestamp
    Given the server is online
    When I check the start time
    Then the start time should be a valid ISO timestamp

  Scenario: VIP mode is active
    Given the server is in VIP mode
    When I request the status
    Then the VIP flag should be true and player count should be low

  Scenario: VIP mode is inactive during normal operations
    Given the server is operating normally
    When I request the status for VIP check
    Then the VIP flag should be false

  Scenario: Server is unavailable (503)
    Given the ESI API is unavailable
    When I request the server status
    Then I should receive a 503 service unavailable error

  Scenario: Internal server error (500)
    Given the ESI API encounters an internal error
    When I request the server status for error check
    Then I should receive a 500 error

  Scenario: Monitor server status over multiple checks
    Given the server is online with gradually changing player counts
    When I check the status multiple times
    Then each check should return valid data with consistent server version
