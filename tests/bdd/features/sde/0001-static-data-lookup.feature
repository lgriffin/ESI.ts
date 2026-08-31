Feature: Static Data Lookup

  # EARS: Event-driven
  Scenario: WHEN looking up a known item type, the provider shall return the data
    Given an SDE provider with Tritanium loaded
    When the user looks up type ID 34
    Then the provider shall return Tritanium with correct attributes

  # EARS: Unwanted
  Scenario: IF looking up an unknown type ID, THEN the provider shall return null
    Given an SDE provider with test data
    When the user looks up a non-existent type ID
    Then the provider shall return null

  # EARS: Event-driven
  Scenario: WHEN searching for types by name, the provider shall return matching results
    Given an SDE provider with multiple types loaded
    When the user searches for types matching "Trit"
    Then the provider shall return types whose names contain "Trit"

  # EARS: Event-driven
  Scenario: WHEN navigating the type hierarchy, the provider shall return connected data
    Given an SDE provider with a complete type hierarchy
    When the user looks up a type and navigates to its group and category
    Then the provider shall return the correct group and category

  # EARS: Event-driven
  Scenario: WHEN navigating the geography hierarchy, the provider shall return connected data
    Given an SDE provider with The Forge region data loaded
    When the user looks up the region and navigates through constellations and systems
    Then the provider shall return Kimotoro constellation and Jita solar system

  # EARS: Event-driven
  Scenario: WHEN looking up stargates for a system, the provider shall return connections
    Given an SDE provider with stargate data for Jita
    When the user looks up stargates for Jita
    Then the provider shall return at least one stargate with a destination
