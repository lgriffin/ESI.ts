Feature: Access Lists Management

  # EARS: Event-driven
  Scenario: WHEN getting access list with mixed entity types, the client shall return the data
    Given an access list exists with characters, corporations, and alliances
    When the client requests the access list
    Then the client shall return all entries with their access types

  # EARS: State-driven
  Scenario: WHILE access list with no entries, the client shall return an empty result
    Given an empty access list exists
    When the client requests the empty access list
    Then the client shall return the list with an empty entries array

  # EARS: Unwanted
  Scenario: IF unauthorized access to access list, THEN the client shall return a forbidden error
    Given no valid token is provided
    When the client requests an access list without auth
    Then the client shall return a 401 error

  # EARS: Unwanted
  Scenario: IF access list not found, THEN the client shall return a not-found error
    Given an access list does not exist
    When the client requests a non-existent access list
    Then the client shall return a 404 error
