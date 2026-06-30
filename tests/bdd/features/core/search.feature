Feature: Search Management

  Scenario: Search for characters by name
    Given a valid character ID and search string
    When I search for characters
    Then I should receive matching character results

  Scenario: Search returns results across multiple categories
    Given a broad search query
    When I search across categories
    Then I should receive results in multiple categories

  Scenario: Search returns empty results
    Given a search query with no matches
    When I search for nonexistent items
    Then I should receive undefined or empty category arrays

  Scenario: Search for solar systems
    Given a search for a solar system name
    When I search for solar systems
    Then I should receive matching system IDs

  Scenario: Search for alliances
    Given a search for an alliance name
    When I search for alliances
    Then I should receive matching alliance IDs

  Scenario: Unauthorized search request
    Given insufficient search permissions
    When I search without permissions
    Then I should receive a 403 search error

  Scenario: Search with short query string
    Given a very short search string
    When I search with a short query
    Then I should still receive valid results
