Feature: Character Management

  Scenario: Retrieve character public profile
    Given a valid character ID
    When I request public information
    Then I should receive complete character profile

  Scenario: Handle non-existent character
    Given an invalid character ID
    When I request public information for the invalid character
    Then I should receive a not found error

  Scenario: Retrieve character portraits
    Given a valid character ID for portrait
    When I request portraits
    Then I should receive image URLs in different sizes

  Scenario: Retrieve character roles
    Given an authenticated character
    When I request roles
    Then I should receive role information

  Scenario: Retrieve corporation history
    Given a character ID for history
    When I request corporation history
    Then I should receive employment history

  Scenario: Retrieve character medals
    Given a character ID for medals
    When I request medals
    Then I should receive medal information

  Scenario: Retrieve character notifications
    Given an authenticated character for notifications
    When I request notifications
    Then I should receive notification list

  Scenario: Handle unauthorized access
    Given an unauthenticated request
    When I access private data without authorization
    Then I should receive an authorization error

  Scenario: Handle expired authentication
    Given an expired token
    When I access private data with expired token
    Then I should receive an authentication error

  Scenario: Handle high-frequency character requests
    Given multiple concurrent character requests
    When I make them simultaneously
    Then all should complete successfully

  Scenario: Measure character API response times
    Given normal API conditions for character
    When I request character data
    Then response should be within acceptable limits

  Scenario: Complete character profile assembly
    Given a character ID for profile assembly
    When I gather complete profile data
    Then I should successfully retrieve all available character information
