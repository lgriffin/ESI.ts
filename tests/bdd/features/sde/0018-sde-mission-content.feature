Feature: Mission Content
  The SDE describes the content agents hand out: missions, the dungeons —
  deadspace pockets — those missions send a pilot into, and the epic arcs
  that chain missions into a story. This feature covers those lookups.

  A mission tool joins a live agent offer to the mission record and shows
  the epic arc it belongs to.

  # ── Point lookups by identifier ──────────────────────────────────────

  Rule: When a mission ID present in the loaded data set is looked up, the SDE provider shall return the mission record carrying its name.
    A mission offer names its mission by ID; the record gives the title a
    mission tool shows.

    Scenario: Mission 1 resolves to Cash Flow for Capsuleers
      Given a static data provider with the reference data set
      When I look up mission 1
      Then the returned record shall be named "Cash Flow for Capsuleers"

  Rule: When a dungeon ID present in the loaded data set is looked up, the SDE provider shall return the dungeon record carrying its name and its faction ID.
    A dungeon is the pocket a mission or an agent in space uses; the faction
    ID says whose ships spawn in it.

    Scenario: Dungeon 1 resolves to its name and faction
      Given a static data provider with the reference data set
      When I look up dungeon 1
      Then the returned record shall be named "Cash Flow Dungeon"
      And the returned record shall carry faction 500004

  Rule: When an epic arc ID present in the loaded data set is looked up, the SDE provider shall return the epic arc record carrying its name and its faction ID.
    An epic arc is a story of chained missions offered by one faction; the
    record gives its title and the faction that runs it.

    Scenario: Epic arc 1 resolves to The Blood-Stained Stars
      Given a static data provider with the reference data set
      When I look up epic arc 1
      Then the returned record shall be named "The Blood-Stained Stars"
      And the returned record shall carry faction 500001

  Rule: When every epic arc is requested, the SDE provider shall return one record for each loaded epic arc.
    There are few epic arcs and a mission tool lists them all.

    Scenario: The two loaded epic arcs are both returned
      Given a static data provider with the reference data set
      When I look up every epic arc
      Then the result should contain exactly 2 records
      And the result shall be the records named "Penumbra, The Blood-Stained Stars"

  # ── Absent identifiers ───────────────────────────────────────────────

  Rule: If a mission, dungeon or epic arc ID is absent from the loaded data set, then the SDE provider shall return null.
    Content tables are large and an extract may carry only some of them;
    null is the answer for a record that is not loaded.

    Scenario: Unknown mission 99 resolves to null
      Given a static data provider with the reference data set
      When I look up mission 99
      Then the provider shall return null

    Scenario: Unknown dungeon 99 resolves to null
      Given a static data provider with the reference data set
      When I look up dungeon 99
      Then the provider shall return null

    Scenario: Unknown epic arc 99 resolves to null
      Given a static data provider with the reference data set
      When I look up epic arc 99
      Then the provider shall return null
