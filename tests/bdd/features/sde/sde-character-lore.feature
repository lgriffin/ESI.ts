Feature: Character and Lore Data Lookup

  Scenario: WHEN looking up a faction, the provider shall return faction details
    Given a static data provider with hierarchical test data
    When I look up faction 500001
    Then the faction name should be "Caldari State"
    And the faction should have race IDs

  Scenario: WHEN navigating the character hierarchy, the provider shall return connected data
    Given a static data provider with hierarchical test data
    When I look up race 1
    Then the race name should be "Caldari"
    When I look up bloodlines for race 1
    Then the result should contain at least 1 bloodline
    When I look up ancestries for bloodline 1
    Then the result should contain at least 1 ancestry

  Scenario: WHEN looking up NPC infrastructure, the provider shall return station details
    Given a static data provider with hierarchical test data
    When I look up NPC station 60003760
    Then the station name should contain "Jita"
    And the station should have security status greater than 0
