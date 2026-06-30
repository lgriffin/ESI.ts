Feature: Killmails Management

  Scenario: Retrieve recent killmails for a character
    Given an authenticated character with killmails
    When I request their recent killmails
    Then I should receive a list of killmail summaries

  Scenario: Character with no recent killmails
    Given an authenticated character with no recent PvP activity
    When I request their killmails
    Then I should receive an empty killmail list

  Scenario: Retrieve full killmail details
    Given a valid killmail ID and hash
    When I request the killmail details
    Then I should receive the complete kill report

  Scenario: Invalid killmail hash returns 404
    Given an invalid killmail hash
    When I request the killmail details with invalid hash
    Then I should receive a 404 not found error

  Scenario: Retrieve recent killmails for a corporation
    Given an authenticated corporation member
    When I request corporation killmails
    Then I should receive the corporation kill feed

  Scenario: Chain summary retrieval to detail lookup
    Given a character with recent killmails for chaining
    When I fetch summaries and then look up details for the first kill
    Then I should get the full kill chain

  Scenario: Analyze killmail attacker composition
    Given a killmail with multiple attackers
    When I analyze the attackers
    Then I should identify the final blow dealer and total damage

  Scenario: Handle unauthorized access to character killmails
    Given an unauthenticated killmail request
    When I request character killmails without auth
    Then I should receive a 403 forbidden error for killmails
