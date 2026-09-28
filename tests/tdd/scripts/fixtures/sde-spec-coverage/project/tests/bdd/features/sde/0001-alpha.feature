Feature: Alpha
  Rule: When getAllCategories is called, the provider shall return every category.
    Scenario: named in the rule only
      Given a provider
      Then the categories are not asserted

  Rule: When a type is looked up, the provider shall return it.
    Scenario: direct call
      Given a provider
      When the type 34 is looked up
      Then the type is returned

    Scenario: through support
      Given a provider
      When the type chain is walked
      Then the type is returned
