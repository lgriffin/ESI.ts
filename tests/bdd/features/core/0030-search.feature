Feature: Search Management

  # EARS: Event-driven
  Scenario: WHEN searching for characters by name, the client shall return matching results
    Given a valid character ID and search string
    When the client searches for characters
    Then the client shall return matching character results

  # EARS: Event-driven
  Scenario: WHEN searching returns results across multiple categories, the client shall return matching results
    Given a broad search query
    When the client searches across categories
    Then the client shall return results in multiple categories

  # EARS: State-driven
  Scenario: WHILE search returns empty results, the client shall return an empty result
    Given a search query with no matches
    When the client searches for nonexistent items
    Then the client shall return undefined or empty category arrays

  # EARS: Event-driven
  Scenario: WHEN searching for solar systems, the client shall return matching results
    Given a search for a solar system name
    When the client searches for solar systems
    Then the client shall return matching system IDs

  # EARS: Event-driven
  Scenario: WHEN searching for alliances, the client shall return matching results
    Given a search for an alliance name
    When the client searches for alliances
    Then the client shall return matching alliance IDs

  # EARS: Unwanted
  Scenario: IF unauthorized search request, THEN the client shall return a forbidden error
    Given insufficient search permissions
    When the client searches without permissions
    Then the client shall return a 403 search error

  # EARS: Event-driven
  Scenario: WHEN searching with short query string, the client shall return matching results
    Given a very short search string
    When the client searches with a short query
    Then I shall still receive valid results
