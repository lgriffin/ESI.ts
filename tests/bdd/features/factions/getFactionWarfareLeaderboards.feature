Feature: Get Faction Warfare Leaderboards

  Scenario: Fetching faction warfare leaderboards
    Given faction warfare leaderboards are available
    When the leaderboards are requested
    Then the response should contain the leaderboards data
