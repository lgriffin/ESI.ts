Feature: Clone Management

  # EARS: Event-driven
  Scenario: WHEN getting clone information for a valid character, the client shall return the data
    Given a valid character ID for clones
    When the client requests clone information
    Then the client shall return clone details

  # EARS: Unwanted
  Scenario: IF unauthorized clone request, THEN the client shall return a forbidden error
    Given an invalid access token for clones
    When the client requests clone information without authorization
    Then the client shall return an authentication error for clones

  # EARS: Event-driven
  Scenario: WHEN getting active implants for a character, the client shall return the data
    Given a valid character ID for implants
    When the client requests implant information
    Then the client shall return a list of implant type IDs

  # EARS: State-driven
  Scenario: WHILE the character with no implants, the client shall return an empty result
    Given a character with no active implants
    When the client requests implant information for the character
    Then the client shall return an empty array for implants

  # EARS: Event-driven
  Scenario: WHEN retrieving clones and their implants, the client shall return the data
    Given a character with clones
    When the client retrieves clone info and implants
    Then the client shall have complete clone data
