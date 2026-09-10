Feature: Dogma and Industry Data
  Dogma is EVE's attribute system: every ship and module carries numbered
  attributes whose meaning lives in the dogma attribute table. Industry data
  covers the recipes — blueprints for manufacturing and planetary schematics
  for planetary interaction.

  These three tables are what a fitting tool, a manufacturing calculator, or a
  planetary industry planner reads, so the SDE provider exposes each as a
  lookup by its own primary key.

  # ── Dogma attributes ─────────────────────────────────────────────────

  Rule: When a dogma attribute ID is looked up, the SDE provider shall return the attribute record carrying its name and its high-is-good flag.
    An attribute value means nothing without its definition: the name gives
    the caller the field to display, and the high-is-good flag says which
    direction of change is an improvement when comparing two fittings.

    Scenario: Attribute 9 is named hp and is flagged high-is-good
      Given a static data provider with hierarchical test data
      When I look up dogma attribute 9
      Then the attribute name should be "hp"
      And the attribute should be marked as high is good

  # ── Manufacturing blueprints ─────────────────────────────────────────

  Rule: When a blueprint type ID is looked up, the SDE provider shall return the blueprint record carrying a manufacturing activity with its material list and its manufacturing time.
    A blueprint holds several activities — manufacturing, invention, copying
    — keyed by name. Manufacturing is the one every industry calculation
    starts from, and it is usable only when both the input materials and the
    job duration are present.

    Scenario: Blueprint 787 manufactures from a material list in 6000 seconds
      Given a static data provider with hierarchical test data
      When I look up blueprint 787
      Then the blueprint should have manufacturing activity
      And the manufacturing should have materials
      And the manufacturing time should be 6000

  # ── Planetary schematics ─────────────────────────────────────────────

  Rule: When a planet schematic ID is looked up, the SDE provider shall return the schematic record carrying its name and its cycle time.
    Planetary interaction runs on fixed-length production cycles, so the
    cycle time is what a planner multiplies out to reach hourly throughput.
    The name identifies the commodity the schematic produces.

    Scenario: Schematic 65 is Bacteria on a 1800 second cycle
      Given a static data provider with hierarchical test data
      When I look up planet schematic 65
      Then the schematic name should be "Bacteria"
      And the schematic cycle time should be 1800
