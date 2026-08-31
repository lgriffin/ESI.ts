Feature: Fleet Management

  # EARS: Event-driven
  Scenario: WHEN getting character fleet info when in a fleet, the client shall return the data
    Given a character that is in a fleet
    When the client requests their fleet info
    Then the client shall return their fleet assignment details

  # EARS: State-driven
  Scenario: WHILE the character is not in any fleet, the client shall return an empty result
    Given a character that is not in a fleet
    When the client requests fleet info for the character not in a fleet
    Then the client shall return a 404 error

  # EARS: Event-driven
  Scenario: WHEN getting fleet information, the client shall return the data
    Given a valid fleet ID
    When the client requests fleet details
    Then the client shall return the fleet MOTD, boss, and settings

  # EARS: Event-driven
  Scenario: WHEN updating fleet settings, the client shall apply the changes
    Given a fleet boss
    When the client updates the fleet MOTD and free-move setting
    Then the fleet update shall complete without error

  # EARS: Event-driven
  Scenario: WHEN listing all fleet members, the client shall return the data
    Given an active fleet with members
    When the client requests the member list
    Then the client shall return member details including ships and roles

  # EARS: Event-driven
  Scenario: WHEN kicking a member from the fleet, the client shall complete the operation
    Given a fleet commander for kicking
    When the client kicks a member from the fleet
    Then the kick operation shall complete without error

  # EARS: Event-driven
  Scenario: WHEN moving a member to a different squad, the client shall complete the move
    Given a fleet commander and a member
    When the client moves the member to a new wing and squad
    Then the move operation shall complete without error

  # EARS: Event-driven
  Scenario: WHEN getting fleet wings structure, the client shall return the data
    Given an active fleet with wings
    When the client requests the fleet wings
    Then the client shall return wings with nested squads

  # EARS: Event-driven
  Scenario: WHEN creating a new fleet wing, the client shall create the resource
    Given a fleet commander for wing creation
    When the client creates a new wing
    Then the client shall return the new wing ID

  # EARS: Event-driven
  Scenario: WHEN creating a new squad under a wing, the client shall create the resource
    Given a fleet with a wing
    When the client creates a squad under that wing
    Then the client shall return the new squad ID

  # EARS: Unwanted
  Scenario: IF unauthorized fleet access, THEN the client shall return a forbidden error
    Given a non-fleet-boss character
    When the client attempts to modify fleet settings
    Then the client shall return a 403 forbidden error for fleet

  # EARS: Ubiquitous
  Scenario: The client shall fetch fleet info, members, and wings concurrently
    Given a valid fleet for concurrent fetch
    When the client fetches fleet details, members, and wings in parallel
    Then all three requests shall resolve successfully
