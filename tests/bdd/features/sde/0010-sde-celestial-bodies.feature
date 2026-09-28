Feature: Celestial Bodies by Identifier
  Feature 0002 lists the star, planets, moons and asteroid belts of a solar
  system. Each of those bodies also has an ID of its own — the ID a planetary
  interaction colony, a moon mining extraction or an anomaly refers to — and
  the SDE provider answers a lookup by that ID directly.

  Every body carries the ID of the solar system it sits in, so a caller that
  starts from a body ID can place it on the map with one further lookup.

  # ── Point lookups by identifier ──────────────────────────────────────

  Rule: When a star, planet, moon or asteroid belt ID present in the loaded data set is looked up, the SDE provider shall return the record carrying that ID and its solar system ID.
    The four body types are separate tables with one access pattern, so they
    are stated once and exercised from four angles. The solar system ID is
    asserted because it is the join back to the map.

    Scenario: Star 40009082 sits in Jita
      Given a static data provider with the extended universe data set
      When I look up star 40009082
      Then the returned star shall have ID 40009082
      And the returned record shall belong to system 30000142

    Scenario: Planet 40009077 sits in Jita
      Given a static data provider with the extended universe data set
      When I look up planet 40009077
      Then the returned planet shall have ID 40009077
      And the returned record shall belong to system 30000142

    Scenario: Moon 40009078 sits in Jita
      Given a static data provider with the extended universe data set
      When I look up moon 40009078
      Then the returned moon shall have ID 40009078
      And the returned record shall belong to system 30000142

    Scenario: Asteroid belt 40009079 sits in Jita
      Given a static data provider with the extended universe data set
      When I look up asteroid belt 40009079
      Then the returned asteroid belt shall have ID 40009079
      And the returned record shall belong to system 30000142

  Rule: If a star, planet, moon or asteroid belt ID is absent from the loaded data set, then the SDE provider shall return null.
    Body IDs come from live data that may be newer than the loaded extract,
    so a miss is expected and answered with null rather than an error.

    Scenario: Unknown star 49999991 resolves to null
      Given a static data provider with the extended universe data set
      When I look up star 49999991
      Then the provider shall return null

    Scenario: Unknown planet 49999992 resolves to null
      Given a static data provider with the extended universe data set
      When I look up planet 49999992
      Then the provider shall return null

    Scenario: Unknown moon 49999993 resolves to null
      Given a static data provider with the extended universe data set
      When I look up moon 49999993
      Then the provider shall return null

    Scenario: Unknown asteroid belt 49999994 resolves to null
      Given a static data provider with the extended universe data set
      When I look up asteroid belt 49999994
      Then the provider shall return null
