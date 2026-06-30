Feature: Universe Information

  Scenario: Retrieve solar system details
    Given a valid solar system ID
    When I request system information
    Then I should receive complete system details

  Scenario: Handle non-existent solar system
    Given an invalid solar system ID
    When I request invalid system information
    Then I should receive a not found error

  Scenario: Retrieve all solar systems
    Given the universe data is available
    When I request all systems
    Then I should receive a list of all system IDs

  Scenario: Retrieve station details
    Given a valid station ID
    When I request station information
    Then I should receive complete station details

  Scenario: Retrieve structure information
    Given a valid structure ID
    When I request structure information
    Then I should receive structure details

  Scenario: Retrieve item type information
    Given a valid type ID
    When I request type information
    Then I should receive complete item details

  Scenario: Retrieve item groups
    Given the universe data is available for groups
    When I request all item groups
    Then I should receive a list of all group IDs

  Scenario: Retrieve item group details
    Given a valid group ID
    When I request group information
    Then I should receive group details and contained types

  Scenario: Retrieve star information
    Given a valid star ID
    When I request star information
    Then I should receive star details

  Scenario: Retrieve planet information
    Given a valid planet ID
    When I request planet information
    Then I should receive planet details

  Scenario: Handle concurrent universe data requests
    Given multiple concurrent universe data requests are prepared
    When I make them simultaneously
    Then all should complete successfully

  Scenario: Handle large universe data sets
    Given a request for all systems with large dataset
    When I process the large dataset
    Then the system should handle it efficiently

  Scenario: Search for universe entities
    Given a search term for the universe
    When I search the universe
    Then I should receive matching entities

  Scenario: Name resolution
    Given a list of entity IDs
    When I request name resolution
    Then I should receive entity names and categories

  Scenario: Complete system exploration workflow
    Given a system ID for exploration
    When I gather complete system information
    Then I should successfully retrieve all system data
