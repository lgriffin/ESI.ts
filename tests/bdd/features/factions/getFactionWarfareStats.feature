Feature: Get Faction Warfare Stats

  Scenario: Fetch faction warfare stats
    Given I have a valid API token
    When I request the faction warfare stats
    Then I should receive the faction warfare stats data

  Scenario: Fetch character faction warfare stats
    Given I have a valid API token
    And a valid character ID of 12345
    When I request the faction warfare stats for the character
    Then I should receive the faction warfare stats data for the character

  Scenario: Fetch corporation faction warfare stats
    Given I have a valid API token
    And a valid corporation ID of 67890
    When I request the faction warfare stats for the corporation
    Then I should receive the faction warfare stats data for the corporation
