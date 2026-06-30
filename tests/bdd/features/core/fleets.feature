Feature: Fleet Management

  Scenario: Get character fleet info when in a fleet
    Given a character that is in a fleet
    When I request their fleet info
    Then I should receive their fleet assignment details

  Scenario: Character is not in any fleet
    Given a character that is not in a fleet
    When I request fleet info for the character not in a fleet
    Then I should receive a 404 error

  Scenario: Get fleet information
    Given a valid fleet ID
    When I request fleet details
    Then I should receive the fleet MOTD, boss, and settings

  Scenario: Update fleet settings
    Given a fleet boss
    When I update the fleet MOTD and free-move setting
    Then the fleet update should complete without error

  Scenario: List all fleet members
    Given an active fleet with members
    When I request the member list
    Then I should receive member details including ships and roles

  Scenario: Kick a member from the fleet
    Given a fleet commander for kicking
    When I kick a member from the fleet
    Then the kick operation should complete without error

  Scenario: Move a member to a different squad
    Given a fleet commander and a member
    When I move the member to a new wing and squad
    Then the move operation should complete without error

  Scenario: Get fleet wings structure
    Given an active fleet with wings
    When I request the fleet wings
    Then I should receive wings with nested squads

  Scenario: Create a new fleet wing
    Given a fleet commander for wing creation
    When I create a new wing
    Then I should receive the new wing ID

  Scenario: Create a new squad under a wing
    Given a fleet with a wing
    When I create a squad under that wing
    Then I should receive the new squad ID

  Scenario: Unauthorized fleet access
    Given a non-fleet-boss character
    When I attempt to modify fleet settings
    Then I should receive a 403 forbidden error for fleet

  Scenario: Fetch fleet info, members, and wings concurrently
    Given a valid fleet for concurrent fetch
    When I fetch fleet details, members, and wings in parallel
    Then all three requests should resolve successfully
