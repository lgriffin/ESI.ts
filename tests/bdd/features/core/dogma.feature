Feature: Dogma System

  Scenario: List all dogma attribute IDs
    Given the dogma API is available
    When I request all attributes
    Then I should receive an array of attribute IDs

  Scenario: Get a specific dogma attribute
    Given a valid attribute ID
    When I request attribute details
    Then I should receive complete attribute information

  Scenario: Handle non-existent attribute
    Given an invalid attribute ID
    When I request attribute details for the invalid ID
    Then I should receive a not found error for the attribute

  Scenario: List all dogma effect IDs
    Given the dogma effects API is available
    When I request all effects
    Then I should receive an array of effect IDs

  Scenario: Get a specific dogma effect
    Given a valid effect ID
    When I request effect details
    Then I should receive complete effect information

  Scenario: Handle non-existent effect
    Given an invalid effect ID
    When I request effect details for the invalid ID
    Then I should receive a not found error for the effect

  Scenario: Get mutated item dogma info
    Given a mutated item exists
    When I request its dynamic dogma info
    Then I should receive modified attributes and effects

  Scenario: Handle non-existent dynamic item
    Given an invalid type and item ID
    When I request dynamic info for the invalid item
    Then I should receive a not found error for the dynamic item
