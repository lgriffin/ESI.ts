Feature: Get Faction Warfare Systems

  Scenario: Retrieve faction warfare systems
    Given faction warfare systems data is available
    When I request the faction warfare systems
    Then the response should contain systems data
