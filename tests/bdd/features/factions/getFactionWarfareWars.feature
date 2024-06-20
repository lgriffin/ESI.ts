Feature: Get Faction Warfare Wars

  Scenario: Fetch faction warfare wars
    Given I have a valid API token
    When I request the faction warfare wars
    Then I should receive the faction warfare wars data
