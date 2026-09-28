Feature: Generic Entity Access
  The SDE has more tables than the provider has typed lookups for. The two
  generic accessors reach any loaded table by its table name — the name the
  ingestion registry gives it, such as eve_types — so a caller can read a
  niche table without waiting for a typed method.

  The records come back untyped; the caller knows the table's shape.

  # ── One record ───────────────────────────────────────────────────────

  Rule: When an entity is looked up by a loaded table name and an ID present in that table, the SDE provider shall return the record the typed lookup for that table returns.
    The generic accessor reads the same store as the typed lookups, so the
    record is the same object with the same fields.

    Scenario: Entity 34 of eve_types is the Tritanium record
      Given a static data provider with the reference data set
      When I look up entity 34 in table "eve_types"
      Then the returned record shall be named "Tritanium"
      And the returned record shall carry group 18

  Rule: If an entity is looked up by a table name that is not loaded, or by an ID absent from that table, then the SDE provider shall return null.
    A wrong table name is the likeliest mistake with an untyped accessor,
    and it answers the same way an absent ID does: null, not an exception.

    Scenario: An unknown table name resolves to null
      Given a static data provider with the reference data set
      When I look up entity 34 in table "eve_nothing"
      Then the provider shall return null

    Scenario: An absent ID in a loaded table resolves to null
      Given a static data provider with the reference data set
      When I look up entity 999999 in table "eve_types"
      Then the provider shall return null

  # ── Whole tables ─────────────────────────────────────────────────────

  Rule: When every entity of a loaded table name is requested, the SDE provider shall return one record for each loaded record of that table.
    Reading a niche table whole is the generic accessor's main use: a
    caller iterates it once and builds its own index.

    Scenario: Every entity of eve_types is the three loaded types
      Given a static data provider with the reference data set
      When I look up every entity in table "eve_types"
      Then the result should contain exactly 3 records
      And the result shall be the records named "Mexallon, Pyerite, Tritanium"

  Rule: If every entity of a table name that is not loaded is requested, then the SDE provider shall return an empty list.
    An unloaded table reads as empty rather than failing, so a caller can
    iterate it without first asking whether the extract carried it.

    Scenario: Every entity of an unknown table is an empty list
      Given a static data provider with the reference data set
      When I look up every entity in table "eve_nothing"
      Then the provider shall return an empty list
