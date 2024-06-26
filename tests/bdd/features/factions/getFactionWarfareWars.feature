Feature: Get Faction Warfare Wars

  Scenario: Retrieve faction warfare wars
    Given faction warfare wars data is available
    When I request the faction warfare wars
    Then the response should contain wars data
