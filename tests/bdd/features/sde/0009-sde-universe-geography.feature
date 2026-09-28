Feature: Universe Geography
  Regions, constellations, solar systems and stargates are the map of New
  Eden. Feature 0001 walks the map downward from a region; this feature
  covers the direct lookups each level answers by its own ID, the full list
  of regions, and finding a system by name.

  Route planners and market tools hold IDs from live API responses — a
  system ID on a market order, a stargate ID on a route — and turn them into
  named records through these lookups.

  # ── Every region ─────────────────────────────────────────────────────

  Rule: When every region is requested, the SDE provider shall return one record for each loaded region.
    The region list is the top of the map and is read whole, to populate a
    region picker or to iterate the market region by region. Each loaded
    region appears once, whether or not it has constellations loaded.

    Scenario: The two loaded regions are both returned
      Given a static data provider with the extended universe data set
      When I look up every region
      Then the result should contain exactly 2 records
      And the result shall be the records named "Domain, The Forge"

  # ── Point lookups by identifier ──────────────────────────────────────

  Rule: When a constellation ID present in the loaded data set is looked up, the SDE provider shall return the constellation record carrying its name and its region ID.
    A constellation is the middle level of the map. The region ID on the
    record is what lets a caller walk back up from a system to its region
    without a search.

    Scenario: Constellation 20000020 resolves to Kimotoro
      Given a static data provider with the extended universe data set
      When I look up constellation 20000020
      Then the provider shall return the constellation named "Kimotoro"
      And the returned record shall carry region 10000002

  Rule: When a solar system ID present in the loaded data set is looked up, the SDE provider shall return the solar system record carrying its name and its constellation ID.
    The solar system is the ID most live API responses carry — on orders,
    killmails, and locations — so this is the lookup callers make most. The
    constellation ID links the system into the map.

    Scenario: Solar system 30000142 resolves to Jita
      Given a static data provider with the extended universe data set
      When I look up solar system 30000142
      Then the provider shall return the solar system named "Jita"
      And the returned record shall carry constellation 20000020

  Rule: When a stargate ID present in the loaded data set is looked up, the SDE provider shall return the stargate record carrying its solar system ID and its destination.
    Feature 0001 lists the stargates of a system; this lookup answers for one
    stargate by its own ID, which is what a route step carries. The record is
    useful only with both ends of the edge, so the system and the destination
    are asserted together.

    Scenario: Stargate 50001248 sits in Jita and leads to Perimeter
      Given a static data provider with the extended universe data set
      When I look up stargate 50001248
      Then the returned stargate shall have ID 50001248
      And the returned record shall belong to system 30000142
      And the stargate destination shall be system 30000144

  Rule: If a constellation, solar system or stargate ID is absent from the loaded data set, then the SDE provider shall return null.
    As for types in 0001: a partial extract or a retired ID is an ordinary
    outcome, and null keeps the caller's control flow simple. The three
    lookups share one rule because they share one answer.

    Scenario: Unknown constellation 29999999 resolves to null
      Given a static data provider with the extended universe data set
      When I look up constellation 29999999
      Then the provider shall return null

    Scenario: Unknown solar system 39999999 resolves to null
      Given a static data provider with the extended universe data set
      When I look up solar system 39999999
      Then the provider shall return null

    Scenario: Unknown stargate 59999999 resolves to null
      Given a static data provider with the extended universe data set
      When I look up stargate 59999999
      Then the provider shall return null

  # ── Search by name ───────────────────────────────────────────────────

  Rule: When a name fragment is searched for among solar systems, the SDE provider shall return the loaded solar systems whose names contain that fragment, ignoring letter case, up to the requested limit.
    Players type system names, not IDs. A case-insensitive substring match
    turns "jit" into Jita, and the limit — 25 when the caller gives none —
    keeps a one-letter fragment from returning the whole map.

    Scenario: Fragment jit matches Jita alone
      Given a static data provider with the extended universe data set
      When the user searches for solar systems matching "jit"
      Then the provider shall return solar systems whose names contain "jit"
      And the result should contain exactly 1 records

    Scenario: Fragment a matches two systems but a limit of 1 returns one
      Given a static data provider with the extended universe data set
      When the user searches for solar systems matching "a" with a limit of 1
      Then the provider shall return solar systems whose names contain "a"
      And the result should contain exactly 1 records
