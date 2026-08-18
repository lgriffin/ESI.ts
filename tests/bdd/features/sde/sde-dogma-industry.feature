Feature: Dogma and Industry Data

  Scenario: WHEN looking up a dogma attribute, the provider shall return attribute details
    Given a static data provider with hierarchical test data
    When I look up dogma attribute 9
    Then the attribute name should be "hp"
    And the attribute should be marked as high is good

  Scenario: WHEN looking up a blueprint, the provider shall return manufacturing data
    Given a static data provider with hierarchical test data
    When I look up blueprint 787
    Then the blueprint should have manufacturing data
    And the manufacturing should have materials
    And the manufacturing time should be 6000

  Scenario: WHEN looking up a planet schematic, the provider shall return schematic details
    Given a static data provider with hierarchical test data
    When I look up planet schematic 65
    Then the schematic name should be "Bacteria"
    And the schematic should have input and output types
