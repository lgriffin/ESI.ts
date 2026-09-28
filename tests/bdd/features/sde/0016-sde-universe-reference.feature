Feature: Universe Reference Tables
  Beside the map itself, the SDE carries reference tables about places:
  landmarks with a position in space, secondary suns placed in some systems,
  and the operations and services an NPC station offers. This feature covers
  those lookups.

  A map tool draws landmarks and secondary suns; a station browser turns a
  station's operation ID and service IDs into labels.

  # ── Landmarks ────────────────────────────────────────────────────────

  Rule: When a landmark ID present in the loaded data set is looked up, the SDE provider shall return the landmark record carrying its name.
    Landmarks are named points of interest in space; the name is what a map
    draws at the position.

    Scenario: Landmark 1 resolves to the EVE Gate
      Given a static data provider with the reference data set
      When I look up landmark 1
      Then the returned record shall be named "EVE Gate"

  Rule: When every landmark is requested, the SDE provider shall return one record for each loaded landmark.
    A map draws every landmark, so the table is read whole.

    Scenario: The two loaded landmarks are both returned
      Given a static data provider with the reference data set
      When I look up every landmark
      Then the result should contain exactly 2 records
      And the result shall be the records named "EVE Gate, Jita 4-4"

  # ── Secondary suns ───────────────────────────────────────────────────

  Rule: When a secondary sun ID present in the loaded data set is looked up, the SDE provider shall return the record carrying its solar system ID and its type ID.
    A secondary sun is an object placed in a system with a system-wide
    effect; the record says which system holds it and which type it is.

    Scenario: Secondary sun 1 sits in Jita
      Given a static data provider with the reference data set
      When I look up secondary sun 1
      Then the returned record shall carry solar system 30000142
      And the returned record shall carry type 46764

  Rule: When the secondary suns of a solar system are requested, the SDE provider shall return every loaded secondary sun whose solar system ID equals that system, and an empty list for a system with none.
    Most systems have no secondary sun, and a system overview asks for
    them by system; an empty list is the ordinary answer.

    Scenario: Jita has one secondary sun
      Given a static data provider with the reference data set
      When I look up secondary suns in system 30000142
      Then the result should contain exactly 1 record
      And each returned record shall carry solar system 30000142

    Scenario: Maurasi has no secondary sun
      Given a static data provider with the reference data set
      When I look up secondary suns in system 30000148
      Then the provider shall return an empty list

  # ── Station operations and services ──────────────────────────────────

  Rule: When a station operation ID present in the loaded data set is looked up, the SDE provider shall return the operation record carrying its operation name.
    An NPC station names its operation by ID; the operation name is the
    station's purpose — Manufacturing, Refinery — as a station browser
    labels it.

    Scenario: Station operation 2 resolves to Refinery
      Given a static data provider with the reference data set
      When I look up station operation 2
      Then the returned record shall carry the operation name "Refinery"

  Rule: When every station operation is requested, the SDE provider shall return one record for each loaded operation.
    The operation table is small and read whole to build a station filter.

    Scenario: The two loaded station operations are both returned
      Given a static data provider with the reference data set
      When I look up every station operation
      Then the result should contain exactly 2 records

  Rule: When a station service ID present in the loaded data set is looked up, the SDE provider shall return the service record carrying its service name.
    A station's services are what a pilot can do there; the service name is
    the label a station browser shows for each.

    Scenario: Station service 1 resolves to Bounty Missions
      Given a static data provider with the reference data set
      When I look up station service 1
      Then the returned record shall carry the service name "Bounty Missions"

  Rule: When every station service is requested, the SDE provider shall return one record for each loaded service.
    The service table is small and read whole to build a station filter.

    Scenario: The two loaded station services are both returned
      Given a static data provider with the reference data set
      When I look up every station service
      Then the result should contain exactly 2 records

  # ── Absent identifiers ───────────────────────────────────────────────

  Rule: If a landmark, secondary sun, station operation or station service ID is absent from the loaded data set, then the SDE provider shall return null.
    A partial extract may omit any of these tables; null is the answer for
    a record that is not loaded.

    Scenario: Unknown landmark 99 resolves to null
      Given a static data provider with the reference data set
      When I look up landmark 99
      Then the provider shall return null

    Scenario: Unknown secondary sun 99 resolves to null
      Given a static data provider with the reference data set
      When I look up secondary sun 99
      Then the provider shall return null

    Scenario: Unknown station operation 99 resolves to null
      Given a static data provider with the reference data set
      When I look up station operation 99
      Then the provider shall return null

    Scenario: Unknown station service 99 resolves to null
      Given a static data provider with the reference data set
      When I look up station service 99
      Then the provider shall return null
