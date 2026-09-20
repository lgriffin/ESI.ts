Feature: Extended Universe Hierarchy Navigation
  Below the region-constellation-system chain, the SDE describes what each
  solar system physically contains: one star, its planets, the moons orbiting
  those planets, and the asteroid belts. The SDE provider exposes each of
  these as a lookup keyed by solar system ID.

  These are the records industry and exploration tooling joins against —
  moon mining targets, planetary interaction sites, belt ore sources — so the
  contained bodies must carry the system ID they belong to.

  # ── The star ─────────────────────────────────────────────────────────

  Rule: When a solar system ID is looked up, the SDE provider shall return the star of that system carrying its type ID and its spectral class.
    A system has exactly one star, so this lookup returns a single record
    rather than a list. Spectral class drives in-game effects such as solar
    panel output, which is why it is asserted alongside the type ID.

    Scenario: Star of system 30000142 is a K7 V
      Given a static data provider with hierarchical test data
      When I look up the star for system 30000142
      Then the star should have a type ID
      And the star should have spectral class "K7 V"

  # ── Contained bodies ─────────────────────────────────────────────────

  Rule: When a solar system ID is looked up, the SDE provider shall return the planets, the moons, and the asteroid belts recorded as belonging to that system.
    The three body types are separate collections but share one access
    pattern, so they are stated as one requirement and exercised from three
    angles below. Each returned body carries the parent system ID, which is
    what lets a caller verify it did not receive a body from elsewhere.

    Scenario: Planets of system 30000142 all reference that system
      Given a static data provider with hierarchical test data
      When I look up planets for system 30000142
      Then the result should contain at least 1 planet
      And each planet should belong to system 30000142

    Scenario: Moons of system 30000142 all reference that system
      Given a static data provider with hierarchical test data
      When I look up moons for system 30000142
      Then the result should contain at least 1 moon
      And each moon should belong to system 30000142

    Scenario: Asteroid belts are returned for system 30000142
      Given a static data provider with hierarchical test data
      When I look up asteroid belts for system 30000142
      Then the result should contain at least 1 asteroid belt
