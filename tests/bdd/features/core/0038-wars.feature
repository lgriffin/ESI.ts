Feature: Wars Management

  # EARS: Event-driven
  Scenario: WHEN listing all wars, the client shall return the data
    Given wars exist in the system
    When the client requests the list of wars
    Then the client shall return an array of war IDs

  # EARS: Event-driven
  Scenario: WHEN listing wars, the client shall return them in descending order
    Given multiple wars exist in descending order
    When the client requests the war list
    Then war IDs shall be in descending order

  # EARS: Event-driven
  Scenario: WHEN getting details of an active war, the client shall return the data
    Given an active war exists
    When the client requests the war details
    Then the client shall return complete war information

  # EARS: Event-driven
  Scenario: WHEN getting details of a finished war, the client shall return the data
    Given a finished war exists
    When the client requests the finished war details
    Then the finished timestamp shall be populated

  # EARS: Event-driven
  Scenario: WHEN getting details of a mutual war, the client shall return the data
    Given a mutual war exists
    When the client requests the mutual war details
    Then the mutual flag shall be true

  # EARS: Event-driven
  Scenario: WHEN getting killmails for a war, the client shall return the data
    Given a war with killmails exists
    When the client requests the war killmails
    Then the client shall return killmail summaries

  # EARS: State-driven
  Scenario: WHILE get killmails for a war with no kills, the client shall return an empty result
    Given a war with no killmails exists
    When the client requests the war killmails for empty war
    Then the client shall return an empty killmail array

  # EARS: Unwanted
  Scenario: IF requesting details for an invalid war ID (404), THEN the client shall return a not-found error
    Given an invalid war ID for details
    When the client requests the invalid war details
    Then the client shall return a 404 not found error for war details

  # EARS: Unwanted
  Scenario: IF requesting killmails for an invalid war ID (404), THEN the client shall return a not-found error
    Given an invalid war ID for killmails
    When the client requests killmails for invalid war
    Then the client shall return a 404 not found error for killmails

  # EARS: Event-driven
  Scenario: WHEN analyzing war statistics by comparing aggressor and defender, the client shall return the analysis
    Given a war with combat data exists
    When the client analyzes the war stats
    Then the client shall determine the dominant side

  # EARS: Event-driven
  Scenario: WHEN completing war investigation workflow, the client shall complete all steps
    Given a war ID to investigate
    When the client gathers full war data including details and killmails
    Then the client shall build a complete picture of the conflict
