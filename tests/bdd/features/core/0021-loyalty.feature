Feature: Loyalty Management

  # EARS: Event-driven
  Scenario: WHEN retrieving loyalty points for a character, the client shall return the data
    Given an authenticated character with LP from multiple corporations
    When the client requests their loyalty points
    Then the client shall return LP balances per corporation

  # EARS: State-driven
  Scenario: WHILE the character with no loyalty points, the client shall return an empty result
    Given an authenticated character who has never run missions
    When the client requests their loyalty points expecting none
    Then the client shall return an empty loyalty points list

  # EARS: Event-driven
  Scenario: WHEN identifying the highest LP balance, the client shall return the top corporation
    Given a character with LP across multiple corps
    When the client analyzes their LP balances
    Then the client shall find the highest LP balance

  # EARS: Event-driven
  Scenario: WHEN retrieving loyalty store offers for a corporation, the client shall return the data
    Given a valid NPC corporation
    When the client requests their LP store offers
    Then the client shall return available items with costs

  # EARS: Event-driven
  Scenario: WHEN filtering offers by affordability, the client shall return filtered results
    Given a set of store offers and a character LP balance
    When the client filters by what the character can afford
    Then the client shall report only the affordable offers

  # EARS: Event-driven
  Scenario: WHEN listing offers with required items, the client shall include item details
    Given store offers that require trade-in items
    When the client inspects the offers with requirements
    Then the client shall report the required items and quantities

  # EARS: Unwanted
  Scenario: IF unauthorized access to loyalty points, THEN the client shall return a forbidden error
    Given an unauthenticated loyalty request
    When the client requests character loyalty points without auth
    Then the client shall return a 403 forbidden error for loyalty

  # EARS: Unwanted
  Scenario: IF server error on store offers, THEN the client shall return a server error
    Given the ESI service encounters an internal error
    When the client requests store offers expecting error
    Then the client shall return a 500 server error
