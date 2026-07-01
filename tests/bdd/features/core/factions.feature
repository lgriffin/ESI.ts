Feature: Faction Warfare Management

  # EARS: Event-driven
  Scenario: WHEN getting overall faction warfare statistics, the client shall return the data
    Given the FW system is active
    When the client requests faction warfare stats
    Then the client shall return stats for all factions

  # EARS: Event-driven
  Scenario: WHEN getting FW stats for an enlisted character, the client shall return the data
    Given a character enlisted in faction warfare
    When the client requests character FW stats
    Then the client shall return their personal statistics

  # EARS: Unwanted
  Scenario: IF unauthorized access for character FW stats, THEN the client shall return a forbidden error
    Given an invalid or expired token for character stats
    When the client requests character FW stats with invalid token
    Then the client shall return a 403 forbidden error for character stats

  # EARS: Event-driven
  Scenario: WHEN getting FW stats for an enlisted corporation, the client shall return the data
    Given a corporation enlisted in faction warfare
    When the client requests corporation FW stats
    Then the client shall return the corporation statistics

  # EARS: Unwanted
  Scenario: IF unauthorized access for corporation FW stats, THEN the client shall return a forbidden error
    Given an invalid or expired token for corporation stats
    When the client requests corporation FW stats with invalid token
    Then the client shall return a 403 forbidden error for corporation stats

  # EARS: Event-driven
  Scenario: WHEN getting current ownership of FW systems, the client shall return the data
    Given active faction warfare systems
    When the client requests FW systems
    Then the client shall return system ownership and contested status

  # EARS: Event-driven
  Scenario: WHEN getting list of active FW wars, the client shall return the data
    Given faction warfare is active
    When the client requests FW wars
    Then the client shall return the list of faction conflicts

  # EARS: Event-driven
  Scenario: WHEN getting overall FW leaderboard, the client shall return the data
    Given faction warfare is active for leaderboard
    When the client requests the overall leaderboard
    Then the client shall return faction rankings

  # EARS: Event-driven
  Scenario: WHEN getting character FW leaderboard, the client shall return the data
    Given faction warfare is active for character leaderboard
    When the client requests the character leaderboard
    Then the client shall return top character rankings

  # EARS: Event-driven
  Scenario: WHEN completing faction warfare overview, the client shall complete all steps
    Given an enlisted character for overview
    When the client gathers all FW data concurrently
    Then the client shall have a complete faction warfare picture
