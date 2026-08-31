Feature: Status Management

  # EARS: Event-driven
  Scenario: WHEN getting current server status, the client shall return the data
    Given the Tranquility server is online
    When the client requests the server status
    Then the client shall return current status information

  # EARS: Event-driven
  Scenario: WHEN verifying player count is reasonable, the client shall validate the data
    Given the server is online with a typical player count
    When the client checks the player count
    Then the player count shall be within expected bounds

  # EARS: Event-driven
  Scenario: WHEN verifying start time is a valid timestamp, the client shall validate the data
    Given the server is online
    When the client checks the start time
    Then the start time shall be a valid ISO timestamp

  # EARS: Event-driven
  Scenario: WHEN VIP mode is active, the client shall report the VIP status
    Given the server is in VIP mode
    When the client requests the status
    Then the VIP flag should be true and player count shall be low

  # EARS: Event-driven
  Scenario: WHEN VIP mode is inactive, the client shall report normal operations
    Given the server is operating normally
    When the client requests the status for VIP check
    Then the VIP flag shall be false

  # EARS: Unwanted
  Scenario: IF server is unavailable (503), THEN the client shall handle the service outage
    Given the ESI API is unavailable
    When the client requests the server status
    Then the client shall return a 503 service unavailable error

  # EARS: Unwanted
  Scenario: IF internal server error (500), THEN the client shall return a server error
    Given the ESI API encounters an internal error
    When the client requests the server status for error check
    Then the client shall return a 500 error

  # EARS: Ubiquitous
  Scenario: The client shall monitor server status over multiple checks
    Given the server is online with gradually changing player counts
    When the client checks the status multiple times
    Then each check shall return valid data with consistent server version
