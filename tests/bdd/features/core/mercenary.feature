Feature: Mercenary Operations

  Scenario: Get mercenary dens with development data
    Given mercenary dens exist
    When I request dens
    Then I should receive development and anarchy parameters

  Scenario: No mercenary dens available
    Given no dens exist in the area
    When I request dens
    Then I should receive an empty array

  Scenario: Get active MTOs spawned from dens
    Given MTOs are active
    When I request operations
    Then I should receive operation details with status

  Scenario: Cross-reference dens with their operations
    Given dens and MTOs exist
    When I fetch both
    Then I can correlate operations to their parent dens

  Scenario: Service unavailable error
    Given the ESI service is down
    When I request mercenary data
    Then I should receive a 503 error
