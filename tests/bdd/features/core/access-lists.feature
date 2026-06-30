Feature: Access Lists Management

  Scenario: Get access list with mixed entity types
    Given an access list exists with characters, corporations, and alliances
    When I request the access list
    Then I should receive all entries with their access types

  Scenario: Access list with no entries
    Given an empty access list exists
    When I request the empty access list
    Then I should receive the list with an empty entries array

  Scenario: Unauthorized access to access list
    Given no valid token is provided
    When I request an access list without auth
    Then I should receive a 401 error

  Scenario: Access list not found
    Given an access list does not exist
    When I request a non-existent access list
    Then I should receive a 404 error
