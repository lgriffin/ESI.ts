Feature: Dogma System

  # EARS: Event-driven
  Scenario: WHEN listing all dogma attribute IDs, the client shall return the data
    Given the dogma API is available
    When the client requests all attributes
    Then the client shall return an array of attribute IDs

  # EARS: Event-driven
  Scenario: WHEN getting a specific dogma attribute, the client shall return the data
    Given a valid attribute ID
    When the client requests attribute details
    Then the client shall return complete attribute information

  # EARS: Unwanted
  Scenario: IF non-existent attribute, THEN the client shall return a not-found error
    Given an invalid attribute ID
    When the client requests attribute details for the invalid ID
    Then the client shall return a not found error for the attribute

  # EARS: Event-driven
  Scenario: WHEN listing all dogma effect IDs, the client shall return the data
    Given the dogma effects API is available
    When the client requests all effects
    Then the client shall return an array of effect IDs

  # EARS: Event-driven
  Scenario: WHEN getting a specific dogma effect, the client shall return the data
    Given a valid effect ID
    When the client requests effect details
    Then the client shall return complete effect information

  # EARS: Unwanted
  Scenario: IF non-existent effect, THEN the client shall return a not-found error
    Given an invalid effect ID
    When the client requests effect details for the invalid ID
    Then the client shall return a not found error for the effect

  # EARS: Event-driven
  Scenario: WHEN getting mutated item dogma info, the client shall return the data
    Given a mutated item exists
    When the client requests its dynamic dogma info
    Then the client shall return modified attributes and effects

  # EARS: Unwanted
  Scenario: IF non-existent dynamic item, THEN the client shall return a not-found error
    Given an invalid type and item ID
    When the client requests dynamic info for the invalid item
    Then the client shall return a not found error for the dynamic item
