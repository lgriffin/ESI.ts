Feature: Wars Management

  Scenario: List all wars
    Given wars exist in the system
    When I request the list of wars
    Then I should receive an array of war IDs

  Scenario: Wars are returned in descending order
    Given multiple wars exist in descending order
    When I request the war list
    Then war IDs should be in descending order

  Scenario: Get details of an active war
    Given an active war exists
    When I request the war details
    Then I should receive complete war information

  Scenario: Get details of a finished war
    Given a finished war exists
    When I request the finished war details
    Then the finished timestamp should be populated

  Scenario: Get details of a mutual war
    Given a mutual war exists
    When I request the mutual war details
    Then the mutual flag should be true

  Scenario: Get killmails for a war
    Given a war with killmails exists
    When I request the war killmails
    Then I should receive killmail summaries

  Scenario: Get killmails for a war with no kills
    Given a war with no killmails exists
    When I request the war killmails for empty war
    Then I should receive an empty killmail array

  Scenario: Request details for an invalid war ID (404)
    Given an invalid war ID for details
    When I request the invalid war details
    Then I should receive a 404 not found error for war details

  Scenario: Request killmails for an invalid war ID (404)
    Given an invalid war ID for killmails
    When I request killmails for invalid war
    Then I should receive a 404 not found error for killmails

  Scenario: Analyze war statistics by comparing aggressor and defender
    Given a war with combat data exists
    When I analyze the war stats
    Then I should determine the dominant side

  Scenario: Complete war investigation workflow
    Given a war ID to investigate
    When I gather full war data including details and killmails
    Then I should build a complete picture of the conflict
