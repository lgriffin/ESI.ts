Feature: Fleet Management
  A fleet is a live, short-lived command structure: a boss, a message of the
  day, a tree of wings and squads, and the members assigned into them. The
  Fleet client covers reading that structure — the character's own membership,
  the fleet header, the member roster and the wing tree — and mutating it by
  updating settings, kicking or moving members, and creating wings and squads.

  Fleet endpoints are authenticated and most writes are restricted to the fleet
  boss, so both the no-content success shape and the refusal shape are part of
  the specification.

  # ── Fleet membership of a character ─────────────────────────────────

  Rule: When the client requests the fleet information of a character, the Fleet client shall return the fleet_id and the role held in that fleet.
    This is the entry point to every other call in this file: without the
    fleet_id there is nothing to address. The role travels with it because it
    determines which of the mutations below the caller is permitted to attempt.

    Scenario: Fleet commander sees their fleet ID and role
      Given a character that is in a fleet
      When the client requests their fleet info
      Then the client shall return their fleet assignment details

  Rule: If a character fleet lookup is answered with HTTP 404, then the Fleet client shall reject with an EsiError.
    ESI reports "not currently in a fleet" as a 404 rather than as an empty
    body, so the not-in-a-fleet case surfaces as a typed rejection. Callers
    treating fleet membership as optional need to catch rather than test for a
    null.

    Scenario: Character who is not in any fleet
      Given a character that is not in a fleet
      When the client requests fleet info for the character not in a fleet
      Then the client shall return a 404 error

  # ── Fleet composition ───────────────────────────────────────────────

  Rule: When the client requests fleet information, the Fleet client shall return the fleet_id, the MOTD, the free-move setting, and the fleet boss identifier.
    The fleet header is the settings record: who is in charge, what the
    broadcast message says, and whether members may reposition themselves in
    the hierarchy without the boss. These are the same fields the update
    endpoint writes.

    Scenario: Fleet details include the MOTD and free-move flag
      Given a valid fleet ID
      When the client requests fleet details
      Then the client shall return the fleet MOTD, boss, and settings

  Rule: When the client requests fleet members, the Fleet client shall return one entry per member carrying character_id, role, ship_type_id, and solar_system_id.
    The roster is what a fleet commander's tooling renders: who is present,
    what they are flying, where they are, and what authority they hold. Ship
    and system come from the same call rather than needing a separate location
    lookup per member.

    Scenario: Member list covers commanders and squad members
      Given an active fleet with members
      When the client requests the member list
      Then the client shall return member details including ships and roles

  Rule: When the client requests fleet wings, the Fleet client shall return each wing with its identifier, name, and nested squad list.
    The wing tree is returned whole rather than as a flat list with parent
    pointers, so a caller can render the hierarchy without a join. Wings with
    differing squad counts are covered by the same shape.

    Scenario: Wings expose their nested squads
      Given an active fleet with wings
      When the client requests the fleet wings
      Then the client shall return wings with nested squads

  # ── Growing the fleet structure ─────────────────────────────────────

  Rule: When the client creates a fleet wing, the Fleet client shall return the wing_id assigned by the server.
    Wing identifiers are allocated server-side, and the returned ID is the
    handle needed to create squads underneath the new wing or to move members
    into it.

    Scenario: New wing returns the assigned wing ID
      Given a fleet commander for wing creation
      When the client creates a new wing
      Then the client shall return the new wing ID

  Rule: When the client creates a fleet squad under a wing, the Fleet client shall return the squad_id assigned by the server.
    Squads hang off a wing, so creation takes the parent wing ID and answers
    with the new squad's own identifier — the value a subsequent member move
    targets.

    Scenario: New squad returns the assigned squad ID
      Given a fleet with a wing
      When the client creates a squad under that wing
      Then the client shall return the new squad ID

  # ── Commands with no response body ──────────────────────────────────

  Rule: When the client updates fleet settings, kicks a member, or moves a member, the Fleet client shall resolve with no response body.
    All three mutations answer 204 No Content in ESI. The client surfaces that
    as an undefined resolution rather than a synthesised status object, so the
    absence of a rejection is the success signal. The three scenarios pin the
    same shape across the three verbs.

    Scenario: Updating the MOTD and free-move flag
      Given a fleet boss
      When the client updates the fleet MOTD and free-move setting
      Then the fleet update shall complete without error

    Scenario: Kicking a member out of the fleet
      Given a fleet commander for kicking
      When the client kicks a member from the fleet
      Then the kick operation shall complete without error

    Scenario: Moving a member to another wing and squad
      Given a fleet commander and a member
      When the client moves the member to a new wing and squad
      Then the move operation shall complete without error

  # ── Concurrent retrieval ────────────────────────────────────────────

  Rule: When fleet information, members, and wings are requested together in one Promise.all, the Fleet client shall resolve each request with its own response.
    A fleet display needs all three views at once and they are independent
    reads. The client keeps no per-instance request state that concurrent calls
    could corrupt, and this scenario holds that property in place.

    Scenario: Details, members, and wings fetched in parallel
      Given a valid fleet for concurrent fetch
      When the client fetches fleet details, members, and wings in parallel
      Then all three requests shall resolve successfully

  # ── Unauthorised access ─────────────────────────────────────────────

  Rule: If a fleet modification is answered with HTTP 403, then the Fleet client shall reject with an EsiError.
    Fleet writes are restricted to the boss, and ESI refuses everyone else with
    403. Surfacing that as a typed rejection lets a caller distinguish "you are
    not the boss" from a transport failure without parsing the body.

    Scenario: Non-boss attempting to change fleet settings
      Given a non-fleet-boss character
      When the client attempts to modify fleet settings
      Then the client shall return a 403 forbidden error for fleet
