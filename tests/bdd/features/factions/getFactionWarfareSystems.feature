Feature: Get Faction Warfare Systems

  Scenario: Fetch faction warfare systems
    Given I have a valid API token
    When I request the faction warfare systems
    Then I should receive the faction warfare systems data
