Feature: Character and Lore Data Lookup
  Character creation in EVE is a chain of choices — race, then bloodline, then
  ancestry — and the SDE stores each level as its own table linked by ID.
  Factions sit above races, and NPC stations are the empire-owned
  infrastructure those factions operate.

  These tables are what a caller joins against to turn the numeric IDs in an
  ESI character or station response into names, owners, and the station
  properties that affect gameplay.

  # ── Factions ─────────────────────────────────────────────────────────

  Rule: When a faction ID is looked up, the SDE provider shall return the faction record carrying its name and its list of member races.
    A faction is the top of the lore hierarchy, and its member race list is
    the link down into character data. An empty list would leave a caller
    unable to connect a faction to any character that belongs to it.

    Scenario: Faction 500001 is the Caldari State and lists member races
      Given a static data provider with hierarchical test data
      When I look up faction 500001
      Then the faction name should be "Caldari State"
      And the faction should have member races

  # ── Race, bloodline, ancestry chain ──────────────────────────────────

  Rule: When the character origin chain is traversed from a race ID, the SDE provider shall return the race record, the bloodlines of that race, and the ancestries of each of those bloodlines.
    Each level is a separate lookup keyed by the level above it, mirroring the
    order of the in-game character creator. The chain holds only if every
    link resolves, so one scenario walks all three levels in sequence rather
    than testing each in isolation.

    Scenario: Race 1 Caldari descends to bloodlines and ancestries
      Given a static data provider with hierarchical test data
      When I look up race 1
      Then the race name should be "Caldari"
      When I look up bloodlines for race 1
      Then the result should contain at least 1 bloodline
      When I look up ancestries for bloodline 1
      Then the result should contain at least 1 ancestry

  # ── NPC infrastructure ───────────────────────────────────────────────

  Rule: When an NPC station ID is looked up, the SDE provider shall return the station record carrying its owner ID and its reprocessing efficiency.
    NPC stations are fixed infrastructure, unlike player structures, so their
    properties live in static data rather than behind an ESI call. The owner
    ID resolves to the operating corporation and the reprocessing efficiency
    determines the yield a refining calculation produces.

    Scenario: NPC station 60003760 reports an owner and a reprocessing efficiency
      Given a static data provider with hierarchical test data
      When I look up NPC station 60003760
      Then the station should have an owner
      And the station should have reprocessing efficiency
