Feature: Planetary Interaction Management

  Scenario: List all colonies for a character
    Given a valid character ID for PI
    When I request planetary colonies
    Then I should receive a list of colonies

  Scenario: Character with no colonies
    Given a character with no PI colonies
    When I request colonies
    Then I should receive an empty colony array

  Scenario: Get detailed layout for a colony
    Given a character ID and planet ID
    When I request the colony layout
    Then I should receive pins, links, and routes

  Scenario: Get layout for an empty colony
    Given a colony with no structures
    When I request the layout
    Then I should receive empty arrays

  Scenario: Get a PI schematic by ID
    Given a valid schematic ID
    When I request the schematic
    Then I should receive schematic details

  Scenario: Schematic not found
    Given an invalid schematic ID
    When I request the invalid schematic
    Then I should receive a 404 error

  Scenario: List customs offices for a corporation
    Given a valid corporation ID for customs offices
    When I request customs offices
    Then I should receive a list of customs offices

  Scenario: Unauthorized access to customs offices
    Given insufficient permissions for customs offices
    When I request customs offices without permissions
    Then I should receive a 403 error

  Scenario: Retrieve colonies and inspect their layouts
    Given a character with colonies for workflow
    When I retrieve colonies and then their layouts
    Then I should have complete PI data
