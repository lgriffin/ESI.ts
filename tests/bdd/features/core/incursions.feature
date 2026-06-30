Feature: Incursion Management

  Scenario: List all active incursions
    Given active incursions exist in the universe
    When I request the incursion list
    Then I should receive complete incursion details

  Scenario: No active incursions
    Given no incursions are active in the universe
    When I request the incursion list for empty state
    Then I should receive an empty array

  Scenario: Incursion in withdrawing state
    Given an incursion in the withdrawing state
    When I request the incursion list for withdrawing state
    Then the incursion should show zero influence and no boss

  Scenario: Multiple incursions across different constellations
    Given multiple incursions in different regions
    When I request the list of multiple incursions
    Then each should have unique constellation and staging system IDs

  Scenario: ESI service unavailable
    Given the ESI service is experiencing downtime
    When I request incursions during downtime
    Then I should receive a 503 service unavailable error

  Scenario: Server error during incursion retrieval
    Given an internal server error occurs
    When I request incursions and a server error happens
    Then the error should indicate a server-side issue

  Scenario: Verify incursion influence is within expected bounds
    Given active incursions with varying influence
    When I examine the incursion results
    Then all influence values should be between 0 and 1
