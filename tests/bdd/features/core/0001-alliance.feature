Feature: Alliance Management

  # EARS: Event-driven
  Scenario: WHEN getting alliance details for valid alliance ID, the client shall return the data
    Given a valid alliance ID
    When the client requests alliance details
    Then the client shall return complete alliance information

  # EARS: Unwanted
  Scenario: IF non-existent alliance ID, THEN the client shall return a not-found error
    Given an invalid alliance ID
    When the client requests alliance details for the invalid ID
    Then the client shall return a not found error

  # EARS: Unwanted
  Scenario: IF network connectivity issues occur, THEN the client shall handle them gracefully
    Given network connectivity problems
    When the client requests alliance details during network issues
    Then the client shall return a network error

  # EARS: Event-driven
  Scenario: WHEN retrieving alliance contacts, the client shall return the data
    Given a valid alliance with contacts
    When the client requests contact list
    Then the client shall return an array of contacts

  # EARS: State-driven
  Scenario: WHILE empty contact list, the client shall return an empty result
    Given an alliance with no contacts
    When the client requests contact list for the alliance
    Then the client shall return an empty array

  # EARS: Unwanted
  Scenario: IF rate limiting gracefully, THEN the client shall respect the rate limit
    Given API rate limiting is active
    When the client makes a rate limited request
    Then the client shall return appropriate rate limit errors

  # EARS: Ubiquitous
  Scenario: The client shall measure response performance
    Given normal API conditions
    When the client requests alliance data
    Then the response shall be within acceptable time limits

  # EARS: Event-driven
  Scenario: WHEN completing alliance information gathering, the client shall complete all steps
    Given a valid alliance ID for information gathering
    When the client gathers complete alliance information
    Then the client shall successfully retrieve all related data
