Feature: Extended Universe Hierarchy Navigation

  Scenario: WHEN looking up a star by system, the provider shall return the star
    Given a static data provider with hierarchical test data
    When I look up the star for system 30000142
    Then the star should have a type ID
    And the star should have spectral class "K7 V"

  Scenario: WHEN looking up planets for a system, the provider shall return planets
    Given a static data provider with hierarchical test data
    When I look up planets for system 30000142
    Then the result should contain at least 1 planet
    And each planet should belong to system 30000142

  Scenario: WHEN looking up moons for a system, the provider shall return moons
    Given a static data provider with hierarchical test data
    When I look up moons for system 30000142
    Then the result should contain at least 1 moon
    And each moon should belong to system 30000142

  Scenario: WHEN looking up asteroid belts for a system, the provider shall return belts
    Given a static data provider with hierarchical test data
    When I look up asteroid belts for system 30000142
    Then the result should contain at least 1 asteroid belt
