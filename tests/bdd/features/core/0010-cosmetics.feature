Feature: Cosmetics SKINR

  # EARS: Event-driven
  Scenario: WHEN getting character SKINR licenses, the client shall return owned designs
    Given the character owns SKINR licenses
    When the client requests character SKINR
    Then the client shall return the license data

  # EARS: Event-driven
  Scenario: WHEN getting SKINR components, the client shall return component licenses
    Given the character owns SKINR components
    When the client requests SKINR components
    Then the client shall return component data with types

  # EARS: Event-driven
  Scenario: WHEN looking up a public SKINR design, the client shall return design attributes
    Given a public SKINR design exists
    When the client requests SKINR attributes
    Then the client shall return the design layout and tier

  # EARS: State-driven
  Scenario: WHILE character has no SKINR licenses, the client shall return empty results
    Given the character has no SKINR licenses
    When the client requests character SKINR
    Then the client shall return an empty license list

  # EARS: Unwanted
  Scenario: IF service unavailable error, THEN the client shall handle the service outage
    Given the ESI service is down
    When the client requests cosmetics data
    Then the client shall return a 503 error
