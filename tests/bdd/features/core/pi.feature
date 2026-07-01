Feature: Planetary Interaction Management

  # EARS: Event-driven
  Scenario: WHEN listing all colonies for a character, the client shall return the data
    Given a valid character ID for PI
    When the client requests planetary colonies
    Then the client shall return a list of colonies

  # EARS: State-driven
  Scenario: WHILE the character with no colonies, the client shall return an empty result
    Given a character with no PI colonies
    When the client requests colonies
    Then the client shall return an empty colony array

  # EARS: Event-driven
  Scenario: WHEN getting detailed layout for a colony, the client shall return the data
    Given a character ID and planet ID
    When the client requests the colony layout
    Then the client shall return pins, links, and routes

  # EARS: State-driven
  Scenario: WHILE get layout for an empty colony, the client shall return an empty result
    Given a colony with no structures
    When the client requests the layout
    Then the client shall return empty arrays

  # EARS: Event-driven
  Scenario: WHEN getting a PI schematic by ID, the client shall return the data
    Given a valid schematic ID
    When the client requests the schematic
    Then the client shall return schematic details

  # EARS: Unwanted
  Scenario: IF schematic not found, THEN the client shall return a not-found error
    Given an invalid schematic ID
    When the client requests the invalid schematic
    Then the client shall return a 404 error

  # EARS: Event-driven
  Scenario: WHEN listing customs offices for a corporation, the client shall return the data
    Given a valid corporation ID for customs offices
    When the client requests customs offices
    Then the client shall return a list of customs offices

  # EARS: Unwanted
  Scenario: IF unauthorized access to customs offices, THEN the client shall return a forbidden error
    Given insufficient permissions for customs offices
    When the client requests customs offices without permissions
    Then the client shall return a 403 error

  # EARS: Event-driven
  Scenario: WHEN retrieving colonies and inspect their layouts, the client shall return the data
    Given a character with colonies for workflow
    When the client retrieves colonies and then their layouts
    Then the client shall have complete PI data
