Feature: NPC Organisations
  New Eden's NPC corporations, their stations, their named characters and
  their agents are reference data a mission tool, a standings tracker or a
  station browser reads constantly. Feature 0005 looks one NPC station up by
  ID; this feature covers the corporation itself, the corporations of a
  faction, the stations of a system or an owner, NPC characters by ID, by
  corporation and by name, and the tables that describe corporations and
  agents: activities, divisions, agent types and agents in space.

  Every record here is keyed by the same ID the live API uses for the
  corporation, character or station, so live responses join to it directly.

  # ── NPC corporations ─────────────────────────────────────────────────

  Rule: When an NPC corporation ID present in the loaded data set is looked up, the SDE provider shall return the corporation record carrying its name, its faction ID and its ticker.
    A corporation ID appears on stations, agents, characters and standings.
    The faction ID places it in a faction and the ticker is the short label
    the game shows.

    Scenario: NPC corporation 1000035 resolves to the Caldari Navy
      Given a static data provider with the reference data set
      When I look up NPC corporation 1000035
      Then the returned record shall be named "Caldari Navy"
      And the returned record shall carry faction 500001
      And the returned record shall carry the ticker "CN"

  Rule: When the NPC corporations of a faction are requested, the SDE provider shall return every loaded corporation whose faction ID equals that faction, and an empty list for a faction with none loaded.
    A faction's corporations are the ones its standings flow to. A faction
    with no corporations loaded answers with an empty list, not null.

    Scenario: Faction 500001 has two corporations
      Given a static data provider with the reference data set
      When I look up NPC corporations of faction 500001
      Then the result should contain exactly 2 records
      And each returned record shall carry faction 500001

    Scenario: Faction 500004 has no corporations loaded
      Given a static data provider with the reference data set
      When I look up NPC corporations of faction 500004
      Then the provider shall return an empty list

  # ── NPC stations ─────────────────────────────────────────────────────

  Rule: When the NPC stations of a solar system are requested, the SDE provider shall return every loaded station whose solar system ID equals that system, and an empty list for a system with none loaded.
    A station browser lists the stations of the system a character is in.
    A system with no stations loaded answers with an empty list.

    Scenario: Jita has one station loaded
      Given a static data provider with the reference data set
      When I look up NPC stations in system 30000142
      Then the result should contain exactly 1 record
      And each returned record shall carry solar system 30000142

    Scenario: Maurasi has no stations loaded
      Given a static data provider with the reference data set
      When I look up NPC stations in system 30000148
      Then the provider shall return an empty list

  Rule: When the NPC stations of an owner are requested, the SDE provider shall return every loaded station whose owner ID equals that corporation.
    A corporation's stations are where its agents and its loyalty point
    store live; the owner ID is the corporation ID.

    Scenario: Caldari Provisions owns the Perimeter station
      Given a static data provider with the reference data set
      When I look up NPC stations owned by 1000009
      Then the result should contain exactly 1 record
      And each returned record shall carry owner 1000009

  # ── NPC characters ───────────────────────────────────────────────────

  Rule: When an NPC character ID present in the loaded data set is looked up, the SDE provider shall return the character record carrying its name and its corporation ID.
    Agents and corporation CEOs are NPC characters; a live response names
    them by character ID and the record gives the name and employer.

    Scenario: NPC character 3004451 resolves to Aakiro Tenaka
      Given a static data provider with the reference data set
      When I look up NPC character 3004451
      Then the returned record shall be named "Aakiro Tenaka"
      And the returned record shall carry corporation 1000035

  Rule: When the NPC characters of a corporation are requested, the SDE provider shall return every loaded character whose corporation ID equals that corporation.
    A corporation's characters are its agents and officers; the list is what
    an agent finder filters by corporation.

    Scenario: The Caldari Navy employs two loaded characters
      Given a static data provider with the reference data set
      When I look up NPC characters of corporation 1000035
      Then the result should contain exactly 2 records
      And each returned record shall carry corporation 1000035

  Rule: When a name fragment is searched for among NPC characters, the SDE provider shall return the loaded NPC characters whose names contain that fragment, ignoring letter case, up to the requested limit.
    An agent finder takes a typed name; a case-insensitive substring match
    is what lets a user find an agent without the exact spelling. The limit
    is 25 when the caller gives none.

    Scenario: Fragment AAK matches both Caldari Navy characters
      Given a static data provider with the reference data set
      When the user searches for NPC characters matching "AAK"
      Then the provider shall return NPC characters whose names contain "AAK"
      And the result should contain exactly 2 records

    Scenario: A limit of 1 cuts the two matches to one
      Given a static data provider with the reference data set
      When the user searches for NPC characters matching "aak" with a limit of 1
      Then the provider shall return NPC characters whose names contain "aak"
      And the result should contain exactly 1 record

  # ── Corporation reference tables ─────────────────────────────────────

  Rule: When a corporation activity ID present in the loaded data set is looked up, the SDE provider shall return the activity record carrying its name.
    An NPC corporation names its main activity by ID; the record gives the
    label a corporation page shows.

    Scenario: Corporation activity 1 resolves to Warfare
      Given a static data provider with the reference data set
      When I look up corporation activity 1
      Then the returned record shall be named "Warfare"

  Rule: When every corporation activity is requested, the SDE provider shall return one record for each loaded activity.
    The activity table is small and read whole to build a filter.

    Scenario: The two loaded corporation activities are both returned
      Given a static data provider with the reference data set
      When I look up every corporation activity
      Then the result should contain exactly 2 records
      And the result shall be the records named "Security, Warfare"

  Rule: When an NPC corporation division ID present in the loaded data set is looked up, the SDE provider shall return the division record carrying its name and its internal name.
    Agents belong to a division of their corporation; the record gives the
    division's display name and the internal name the client code uses.

    Scenario: NPC corporation division 1 resolves to Accounting
      Given a static data provider with the reference data set
      When I look up NPC corporation division 1
      Then the returned record shall be named "Accounting"
      And the returned record shall carry the internal name "accounting"

  Rule: When every NPC corporation division is requested, the SDE provider shall return one record for each loaded division.
    The division table is read whole to label the agents of a corporation
    by division.

    Scenario: The two loaded divisions are both returned
      Given a static data provider with the reference data set
      When I look up every NPC corporation division
      Then the result should contain exactly 2 records
      And the result shall be the records named "Accounting, Administration"

  # ── Agents ───────────────────────────────────────────────────────────

  Rule: When an agent type ID present in the loaded data set is looked up, the SDE provider shall return the agent type record carrying its name.
    An agent names its type by ID; the type separates mission agents from
    tutorial, research and storyline agents.

    Scenario: Agent type 2 resolves to BasicAgent
      Given a static data provider with the reference data set
      When I look up agent type 2
      Then the returned record shall be named "BasicAgent"

  Rule: When every agent type is requested, the SDE provider shall return one record for each loaded agent type.
    The agent type table is read whole to build an agent finder's filter.

    Scenario: The two loaded agent types are both returned
      Given a static data provider with the reference data set
      When I look up every agent type
      Then the result should contain exactly 2 records
      And the result shall be the records named "BasicAgent, TutorialAgent"

  Rule: When the character ID of an agent in space present in the loaded data set is looked up, the SDE provider shall return the record carrying its solar system ID and its dungeon ID.
    Agents in space sit in a deadspace pocket rather than a station; the
    record says which system and which dungeon holds them.

    Scenario: Agent in space 3018681 sits in Jita
      Given a static data provider with the reference data set
      When I look up agent in space 3018681
      Then the returned record shall carry solar system 30000142
      And the returned record shall carry dungeon 1

  Rule: When the agents in space of a solar system are requested, the SDE provider shall return every loaded agent in space whose solar system ID equals that system, and an empty list for a system with none loaded.
    A system overview lists the agents in space a pilot can visit there. A
    system with none loaded answers with an empty list.

    Scenario: Jita has one agent in space
      Given a static data provider with the reference data set
      When I look up agents in space in system 30000142
      Then the result should contain exactly 1 record
      And each returned record shall carry solar system 30000142

    Scenario: Maurasi has no agents in space
      Given a static data provider with the reference data set
      When I look up agents in space in system 30000148
      Then the provider shall return an empty list

  # ── Absent identifiers ───────────────────────────────────────────────

  Rule: If an NPC corporation, NPC character, corporation activity, NPC corporation division, agent type or agent-in-space ID is absent from the loaded data set, then the SDE provider shall return null.
    A partial extract may omit any of these tables, and a character ID from
    a live response may be a player rather than an NPC; null is the answer
    for a record that is not loaded.

    Scenario: Unknown NPC corporation 1 resolves to null
      Given a static data provider with the reference data set
      When I look up NPC corporation 1
      Then the provider shall return null

    Scenario: A player character ID resolves to no NPC character
      Given a static data provider with the reference data set
      When I look up NPC character 90000001
      Then the provider shall return null

    Scenario: Unknown corporation activity 99 resolves to null
      Given a static data provider with the reference data set
      When I look up corporation activity 99
      Then the provider shall return null

    Scenario: Unknown NPC corporation division 99 resolves to null
      Given a static data provider with the reference data set
      When I look up NPC corporation division 99
      Then the provider shall return null

    Scenario: Unknown agent type 99 resolves to null
      Given a static data provider with the reference data set
      When I look up agent type 99
      Then the provider shall return null

    Scenario: A station agent's character ID resolves to no agent in space
      Given a static data provider with the reference data set
      When I look up agent in space 3004451
      Then the provider shall return null
