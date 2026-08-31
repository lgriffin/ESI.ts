Feature: Killmails Management

  # EARS: Event-driven
  Scenario: WHEN retrieving recent killmails for a character, the client shall return the data
    Given an authenticated character with killmails
    When the client requests their recent killmails
    Then the client shall return a list of killmail summaries

  # EARS: State-driven
  Scenario: WHILE the character with no recent killmails, the client shall return an empty result
    Given an authenticated character with no recent PvP activity
    When the client requests their killmails
    Then the client shall return an empty killmail list

  # EARS: Event-driven
  Scenario: WHEN retrieving full killmail details, the client shall return the data
    Given a valid killmail ID and hash
    When the client requests the killmail details
    Then the client shall return the complete kill report

  # EARS: Unwanted
  Scenario: IF invalid killmail hash returns 404, THEN the client shall return a not-found error
    Given an invalid killmail hash
    When the client requests the killmail details with invalid hash
    Then the client shall return a 404 not found error

  # EARS: Event-driven
  Scenario: WHEN retrieving recent killmails for a corporation, the client shall return the data
    Given an authenticated corporation member
    When the client requests corporation killmails
    Then the client shall return the corporation kill feed

  # EARS: Event-driven
  Scenario: WHEN chaining summary retrieval to detail lookup, the client shall chain the operations
    Given a character with recent killmails for chaining
    When the client fetches summaries and then look up details for the first kill
    Then the client shall return the full kill chain

  # EARS: Event-driven
  Scenario: WHEN analyzing killmail attacker composition, the client shall return the analysis
    Given a killmail with multiple attackers
    When the client analyzes the attackers
    Then I shall identify the final blow dealer and total damage

  # EARS: Unwanted
  Scenario: IF unauthorized access to character killmails, THEN the client shall return a forbidden error
    Given an unauthenticated killmail request
    When the client requests character killmails without auth
    Then the client shall return a 403 forbidden error for killmails
