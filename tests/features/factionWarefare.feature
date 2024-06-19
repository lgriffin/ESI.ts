Feature: Faction Warfare API

Scenario: Fetching character leaderboards
  Given I have a valid ESI API endpoint
  When I request the character leaderboards
  Then I should receive the character leaderboards data

Scenario: Fetching faction stats
  Given I have a valid ESI API endpoint
  When I request the faction stats
  Then I should receive the faction stats data
