Feature: Get Faction Warfare Stats

  Scenario: Retrieve faction warfare statistics
    Given faction warfare statistics are available
    When I request the faction warfare statistics
    Then the response should contain faction warfare data
