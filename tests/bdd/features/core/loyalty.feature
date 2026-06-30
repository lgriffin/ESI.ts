Feature: Loyalty Management

  Scenario: Retrieve loyalty points for a character
    Given an authenticated character with LP from multiple corporations
    When I request their loyalty points
    Then I should receive LP balances per corporation

  Scenario: Character with no loyalty points
    Given an authenticated character who has never run missions
    When I request their loyalty points expecting none
    Then I should receive an empty loyalty points list

  Scenario: Identify highest LP balance
    Given a character with LP across multiple corps
    When I analyze their LP balances
    Then I should be able to find the highest LP balance

  Scenario: Retrieve loyalty store offers for a corporation
    Given a valid NPC corporation
    When I request their LP store offers
    Then I should receive available items with costs

  Scenario: Filter offers by affordability
    Given a set of store offers and a character LP balance
    When I filter by what the character can afford
    Then I should see only the affordable offers

  Scenario: Offers with required items
    Given store offers that require trade-in items
    When I inspect the offers with requirements
    Then I should see the required items and quantities

  Scenario: Handle unauthorized access to loyalty points
    Given an unauthenticated loyalty request
    When I request character loyalty points without auth
    Then I should receive a 403 forbidden error for loyalty

  Scenario: Handle server error on store offers
    Given the ESI service encounters an internal error
    When I request store offers expecting error
    Then I should receive a 500 server error
