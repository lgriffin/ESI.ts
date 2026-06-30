Feature: Faction Warfare Management

  Scenario: Get overall faction warfare statistics
    Given the FW system is active
    When I request faction warfare stats
    Then I should receive stats for all factions

  Scenario: Get FW stats for an enlisted character
    Given a character enlisted in faction warfare
    When I request character FW stats
    Then I should receive their personal statistics

  Scenario: Handle unauthorized access for character FW stats
    Given an invalid or expired token for character stats
    When I request character FW stats with invalid token
    Then I should receive a 403 forbidden error for character stats

  Scenario: Get FW stats for an enlisted corporation
    Given a corporation enlisted in faction warfare
    When I request corporation FW stats
    Then I should receive the corporation statistics

  Scenario: Handle unauthorized access for corporation FW stats
    Given an invalid or expired token for corporation stats
    When I request corporation FW stats with invalid token
    Then I should receive a 403 forbidden error for corporation stats

  Scenario: Get current ownership of FW systems
    Given active faction warfare systems
    When I request FW systems
    Then I should receive system ownership and contested status

  Scenario: Get list of active FW wars
    Given faction warfare is active
    When I request FW wars
    Then I should receive the list of faction conflicts

  Scenario: Get overall FW leaderboard
    Given faction warfare is active for leaderboard
    When I request the overall leaderboard
    Then I should receive faction rankings

  Scenario: Get character FW leaderboard
    Given faction warfare is active for character leaderboard
    When I request the character leaderboard
    Then I should receive top character rankings

  Scenario: Complete faction warfare overview
    Given an enlisted character for overview
    When I gather all FW data concurrently
    Then I should have a complete faction warfare picture
