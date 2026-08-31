Feature: Character Management

  # EARS: Event-driven
  Scenario: WHEN retrieving character public profile, the client shall return the data
    Given a valid character ID
    When the client requests public information
    Then the client shall return complete character profile

  # EARS: Unwanted
  Scenario: IF non-existent character, THEN the client shall return a not-found error
    Given an invalid character ID
    When the client requests public information for the invalid character
    Then the client shall return a not found error

  # EARS: Event-driven
  Scenario: WHEN retrieving character portraits, the client shall return the data
    Given a valid character ID for portrait
    When the client requests portraits
    Then the client shall return image URLs in different sizes

  # EARS: Event-driven
  Scenario: WHEN retrieving character roles, the client shall return the data
    Given an authenticated character
    When the client requests roles
    Then the client shall return role information

  # EARS: Event-driven
  Scenario: WHEN retrieving corporation history, the client shall return the data
    Given a character ID for history
    When the client requests corporation history
    Then the client shall return employment history

  # EARS: Event-driven
  Scenario: WHEN retrieving character medals, the client shall return the data
    Given a character ID for medals
    When the client requests medals
    Then the client shall return medal information

  # EARS: Event-driven
  Scenario: WHEN retrieving character notifications, the client shall return the data
    Given an authenticated character for notifications
    When the client requests notifications
    Then the client shall return notification list

  # EARS: Unwanted
  Scenario: IF unauthorized access, THEN the client shall return a forbidden error
    Given an unauthenticated request
    When the client accesses private data without authorization
    Then the client shall return an authorization error

  # EARS: Unwanted
  Scenario: IF expired authentication, THEN the client shall return an authentication error
    Given an expired token
    When the client accesses private data with expired token
    Then the client shall return an authentication error

  # EARS: Ubiquitous
  Scenario: The client shall handle high-frequency character requests
    Given multiple concurrent character requests
    When the client makes them simultaneously
    Then all requests shall complete successfully

  # EARS: Ubiquitous
  Scenario: The client shall measure character API response times
    Given normal API conditions for character
    When the client requests character data
    Then the response shall be within acceptable limits

  # EARS: Event-driven
  Scenario: WHEN completing character profile assembly, the client shall complete all steps
    Given a character ID for profile assembly
    When the client gathers complete profile data
    Then the client shall successfully retrieve all available character information
