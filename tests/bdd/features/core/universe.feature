Feature: Universe Information

  # EARS: Event-driven
  Scenario: WHEN retrieving solar system details, the client shall return the data
    Given a valid solar system ID
    When the client requests system information
    Then the client shall return complete system details

  # EARS: Unwanted
  Scenario: IF non-existent solar system, THEN the client shall return a not-found error
    Given an invalid solar system ID
    When the client requests invalid system information
    Then the client shall return a not found error

  # EARS: Event-driven
  Scenario: WHEN retrieving all solar systems, the client shall return the data
    Given the universe data is available
    When the client requests all systems
    Then the client shall return a list of all system IDs

  # EARS: Event-driven
  Scenario: WHEN retrieving station details, the client shall return the data
    Given a valid station ID
    When the client requests station information
    Then the client shall return complete station details

  # EARS: Event-driven
  Scenario: WHEN retrieving structure information, the client shall return the data
    Given a valid structure ID
    When the client requests structure information
    Then the client shall return structure details

  # EARS: Event-driven
  Scenario: WHEN retrieving item type information, the client shall return the data
    Given a valid type ID
    When the client requests type information
    Then the client shall return complete item details

  # EARS: Event-driven
  Scenario: WHEN retrieving item groups, the client shall return the data
    Given the universe data is available for groups
    When the client requests all item groups
    Then the client shall return a list of all group IDs

  # EARS: Event-driven
  Scenario: WHEN retrieving item group details, the client shall return the data
    Given a valid group ID
    When the client requests group information
    Then the client shall return group details and contained types

  # EARS: Event-driven
  Scenario: WHEN retrieving star information, the client shall return the data
    Given a valid star ID
    When the client requests star information
    Then the client shall return star details

  # EARS: Event-driven
  Scenario: WHEN retrieving planet information, the client shall return the data
    Given a valid planet ID
    When the client requests planet information
    Then the client shall return planet details

  # EARS: Ubiquitous
  Scenario: The client shall handle concurrent universe data requests
    Given multiple concurrent universe data requests are prepared
    When the client makes them simultaneously
    Then all requests shall complete successfully

  # EARS: Ubiquitous
  Scenario: The client shall handle large universe data sets
    Given a request for all systems with large dataset
    When the client processes the large dataset
    Then the client shall handle it efficiently

  # EARS: Event-driven
  Scenario: WHEN searching for universe entities, the client shall return matching results
    Given a search term for the universe
    When the client searches the universe
    Then the client shall return matching entities

  # EARS: Event-driven
  Scenario: WHEN resolving names to IDs, the client shall return the mappings
    Given a list of entity IDs
    When the client requests name resolution
    Then the client shall return entity names and categories

  # EARS: Event-driven
  Scenario: WHEN completing system exploration workflow, the client shall complete all steps
    Given a system ID for exploration
    When the client gathers complete system information
    Then the client shall successfully retrieve all system data
