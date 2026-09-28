Feature: Market Groups by Identifier and Name
  Feature 0003 walks the market tree from its roots. This feature covers the
  other ways into it: a market group by its own ID, the types a group sells,
  and finding a group by name.

  A type names its market group by ID, so a caller holding a type from a
  market order reaches the branch it is sold under with one lookup, and a
  caller rendering a branch lists the types beneath it with another.

  # ── Point lookup by identifier ───────────────────────────────────────

  Rule: When a market group ID present in the loaded data set is looked up, the SDE provider shall return the market group record carrying its name and its parent group ID.
    The name is what a caller displays; the parent group ID is what lets it
    walk back up to the root, which is how a breadcrumb over the market tree
    is built.

    Scenario: Market group 1857 resolves to Minerals under group 1031
      Given a static data provider with the extended universe data set
      When I look up market group 1857
      Then the provider shall return the market group named "Minerals"
      And the returned record shall carry parent group 1031

  Rule: If a market group ID is absent from the loaded data set, then the SDE provider shall return null.
    A type whose market group is not in the loaded extract is still a valid
    type, so the miss is an ordinary outcome answered with null.

    Scenario: Unknown market group 99999 resolves to null
      Given a static data provider with the extended universe data set
      When I look up market group 99999
      Then the provider shall return null

  # ── Types of a market group ──────────────────────────────────────────

  Rule: When a market group ID is looked up for its types, the SDE provider shall return every loaded type whose market group ID is that group.
    Leaf groups hold the tradeable types; branch groups hold only other
    groups. Both are market groups, so a branch answers with an empty list
    rather than a missing record.

    Scenario: Market group 1857 sells the three loaded minerals
      Given a static data provider with the extended universe data set
      When I look up types in market group 1857
      Then the result should contain exactly 3 records
      And each type should belong to market group 1857

    Scenario: Root market group 1031 exists but sells no types
      Given a static data provider with the extended universe data set
      When I look up types in market group 1031
      Then the provider shall return an empty list

  # ── Search by name ───────────────────────────────────────────────────

  Rule: When a name fragment is searched for among market groups, the SDE provider shall return the loaded market groups whose names contain that fragment, ignoring letter case, up to the requested limit.
    A market search box matches on what the user typed, in whatever case.
    The limit — 25 when the caller gives none — bounds the answer for a
    short fragment.

    Scenario: Fragment MINER matches the Minerals group
      Given a static data provider with the extended universe data set
      When the user searches for market groups matching "MINER"
      Then the provider shall return market groups whose names contain "MINER"
      And the result should contain exactly 1 records
