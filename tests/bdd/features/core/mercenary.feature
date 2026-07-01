Feature: Mercenary Operations

  # EARS: Event-driven
  Scenario: WHEN getting mercenary dens with development data, the client shall return the data
    Given mercenary dens exist
    When the client requests dens
    Then the client shall return development and anarchy parameters

  # EARS: State-driven
  Scenario: WHILE no mercenary dens available, the client shall return an empty result
    Given no dens exist in the area
    When the client requests dens
    Then the client shall return an empty array

  # EARS: Event-driven
  Scenario: WHEN getting active MTOs spawned from dens, the client shall return the data
    Given MTOs are active
    When the client requests operations
    Then the client shall return operation details with status

  # EARS: Event-driven
  Scenario: WHEN cross-referencing dens with their operations, the client shall return the analysis
    Given dens and MTOs exist
    When the client fetches both
    Then the client shall correlate operations to their parent dens

  # EARS: Unwanted
  Scenario: IF service unavailable error, THEN the client shall handle the service outage
    Given the ESI service is down
    When the client requests mercenary data
    Then the client shall return a 503 error
