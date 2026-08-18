Feature: Market Group Hierarchy Navigation

  Scenario: WHEN looking up root market groups, the provider shall return top-level groups
    Given a static data provider with hierarchical test data
    When I look up root market groups
    Then each market group should have null parent group ID

  Scenario: WHEN navigating market group children, the provider shall return child groups
    Given a static data provider with hierarchical test data
    When I look up market groups with parent 1031
    Then the result should contain at least 1 market group
    And the first group name should be "Minerals"
