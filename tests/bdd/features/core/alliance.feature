Feature: Alliance Management

  Scenario: Get alliance details for valid alliance ID
    Given a valid alliance ID
    When I request alliance details
    Then I should receive complete alliance information

  Scenario: Handle non-existent alliance ID
    Given an invalid alliance ID
    When I request alliance details for the invalid ID
    Then I should receive a not found error

  Scenario: Handle network connectivity issues
    Given network connectivity problems
    When I request alliance details during network issues
    Then I should receive a network error

  Scenario: Retrieve alliance contacts
    Given a valid alliance with contacts
    When I request contact list
    Then I should receive an array of contacts

  Scenario: Handle empty contact list
    Given an alliance with no contacts
    When I request contact list for the alliance
    Then I should receive an empty array

  Scenario: Handle rate limiting gracefully
    Given API rate limiting is active
    When I make a rate limited request
    Then I should receive appropriate rate limit errors

  Scenario: Measure response performance
    Given normal API conditions
    When I request alliance data
    Then the response should be within acceptable time limits

  Scenario: Complete alliance information gathering
    Given a valid alliance ID for information gathering
    When I gather complete alliance information
    Then I should successfully retrieve all related data
