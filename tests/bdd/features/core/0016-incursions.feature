Feature: Incursion Management

  # EARS: Event-driven
  Scenario: WHEN listing all active incursions, the client shall return the data
    Given active incursions exist in the universe
    When the client requests the incursion list
    Then the client shall return complete incursion details

  # EARS: State-driven
  Scenario: WHILE no active incursions, the client shall return an empty result
    Given no incursions are active in the universe
    When the client requests the incursion list for empty state
    Then the client shall return an empty array

  # EARS: Event-driven
  Scenario: WHEN an incursion is withdrawing, the client shall report the withdrawing state
    Given an incursion in the withdrawing state
    When the client requests the incursion list for withdrawing state
    Then the incursion shall show zero influence and no boss

  # EARS: Event-driven
  Scenario: WHEN multiple incursions exist, the client shall return all across constellations
    Given multiple incursions in different regions
    When the client requests the list of multiple incursions
    Then each shall have unique constellation and staging system IDs

  # EARS: Unwanted
  Scenario: IF eSI service unavailable, THEN the client shall handle the service outage
    Given the ESI service is experiencing downtime
    When the client requests incursions during downtime
    Then the client shall return a 503 service unavailable error

  # EARS: Unwanted
  Scenario: IF server error during incursion retrieval, THEN the client shall return a server error
    Given an internal server error occurs
    When the client requests incursions and a server error happens
    Then the error shall indicate a server-side issue

  # EARS: Event-driven
  Scenario: WHEN verifying incursion influence is within expected bounds, the client shall validate the data
    Given active incursions with varying influence
    When the client examines the incursion results
    Then all influence values shall be between 0 and 1
