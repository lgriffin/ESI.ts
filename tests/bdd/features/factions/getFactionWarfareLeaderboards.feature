Feature: Get Faction Warfare Leaderboards

  Scenario: Fetch character leaderboards
    Given I have a valid API token
    When I request the faction warfare character leaderboards
    Then I should receive the character leaderboards data

  Scenario: Fetch corporation leaderboards
    Given I have a valid API token
    When I request the faction warfare corporation leaderboards
    Then I should receive the corporation leaderboards data

  Scenario: Fetch overall leaderboards
    Given I have a valid API token
    When I request the faction warfare leaderboards
    Then I should receive the overall leaderboards data
