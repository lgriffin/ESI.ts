Feature: Faction Warfare Management
  Faction warfare is EVE's persistent low-security conflict between the four
  empire militias. The Factions client covers the four views ESI publishes over
  it: aggregate statistics per faction, per-participant statistics for an
  enlisted character or corporation, the current occupancy and contest state of
  every faction warfare solar system, and the kill and victory-point
  leaderboards.

  The participant endpoints are authenticated and scoped, so a stale or
  wrong-scope token is a first-class outcome rather than an edge case.

  # ── Warfare-wide statistics ─────────────────────────────────────────

  Rule: When the client requests faction warfare statistics, the Factions client shall return one record per faction carrying pilots, systems_controlled, kills, and victory_points.
    This is the scoreboard for the whole conflict. Each faction's record
    reports enlisted pilot count and systems held as instantaneous values,
    while kills and victory points are broken into yesterday, last week and
    running total so callers can render trends without keeping history
    themselves.

    Scenario: Every faction reports pilots, systems held, and score totals
      Given the FW system is active
      When the client requests faction warfare stats
      Then the client shall return stats for all factions

  # ── Enlisted participant statistics ─────────────────────────────────

  Rule: When the client requests faction warfare statistics for an enlisted character or corporation, the Factions client shall return that participant's faction, enlistment date, and kill and victory-point totals.
    Characters and corporations enlist separately and ESI exposes them as two
    endpoints, but the payload shape is shared: which militia, since when, and
    how the participant has scored. The character variant adds militia rank,
    the corporation variant adds enlisted pilot count; the two scenarios below
    exercise the same requirement from each side.

    Scenario: Enlisted character reports rank and personal totals
      Given a character enlisted in faction warfare
      When the client requests character FW stats
      Then the client shall return their personal statistics

    Scenario: Enlisted corporation reports pilot count and corporate totals
      Given a corporation enlisted in faction warfare
      When the client requests corporation FW stats
      Then the client shall return the corporation statistics

  # ── Contested space and active conflicts ────────────────────────────

  Rule: When the client requests faction warfare systems, the Factions client shall return each solar system with its owner faction, occupier faction, contested state, and victory point tally.
    Owner and occupier differ while a system is being flipped, which is exactly
    the state a faction warfare tool needs to surface. The contested field is a
    discrete state rather than a boolean, and the victory point tally against
    its threshold is what drives progress display.

    Scenario: Contested and uncontested systems are distinguished
      Given active faction warfare systems
      When the client requests FW systems
      Then the client shall return system ownership and contested status

  Rule: When the client requests faction warfare wars, the Factions client shall return each active conflict as a faction identifier paired with the faction it opposes.
    The war list is the pairing table for the militias. It is deliberately
    minimal — two IDs per entry — because everything else about a faction is
    served by the statistics endpoints above.

    Scenario: Active conflicts list each faction and its opponent
      Given faction warfare is active
      When the client requests FW wars
      Then the client shall return the list of faction conflicts

  # ── Leaderboards ────────────────────────────────────────────────────

  Rule: When the client requests a faction warfare leaderboard, the Factions client shall return kill and victory-point rankings whose entries pair the ranked faction or character with a score amount.
    Both leaderboard endpoints share one envelope: a kills block and a
    victory_points block, each split into yesterday, last week and active
    total. Only the identity key changes — faction_id for the overall board,
    character_id for the character board — so the two scenarios verify one
    requirement against both identity types.

    Scenario: Overall leaderboard ranks factions by kills and victory points
      Given faction warfare is active for leaderboard
      When the client requests the overall leaderboard
      Then the client shall return faction rankings

    Scenario: Character leaderboard ranks individual pilots
      Given faction warfare is active for character leaderboard
      When the client requests the character leaderboard
      Then the client shall return top character rankings

  # ── Concurrent retrieval ────────────────────────────────────────────

  Rule: When faction warfare lookups are issued together in one Promise.all, the Factions client shall resolve each lookup with its own response.
    A dashboard needs the whole picture at once, and the client holds no
    per-instance mutable request state that would make concurrent calls
    interfere. This scenario pins that down across five endpoints at once.

    Scenario: Overview gathers stats, systems, and wars in one pass
      Given an enlisted character for overview
      When the client gathers all FW data concurrently
      Then the client shall have a complete faction warfare picture

  # ── Unauthorised access ─────────────────────────────────────────────

  Rule: If a faction warfare participant lookup is answered with HTTP 403, then the Factions client shall reject with an EsiError.
    The character and corporation statistics endpoints both require a scoped
    token, and ESI answers a missing scope or an expired token with 403 rather
    than 401. Both scenarios assert the same typed rejection so callers can
    branch on error class instead of parsing a message.

    Scenario: Character statistics with an expired token
      Given an invalid or expired token for character stats
      When the client requests character FW stats with invalid token
      Then the client shall return a 403 forbidden error for character stats

    Scenario: Corporation statistics with an expired token
      Given an invalid or expired token for corporation stats
      When the client requests corporation FW stats with invalid token
      Then the client shall return a 403 forbidden error for corporation stats
