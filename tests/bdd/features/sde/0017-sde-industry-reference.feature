Feature: Industry Reference Tables
  Feature 0004 looks up one blueprint and one planetary schematic. Industry
  also needs the schematic table whole, the industry activities a job can
  run, the certificates that recommend skills for a hull, and the three
  per-type extension tables: a type's dogma attributes and effects, its
  reprocessing materials, and a ship's role bonuses. This feature covers
  those lookups.

  An industry tool joins a live job's activity ID to a name here, and a
  fitting tool reads a type's dogma and bonuses before it can evaluate a fit.

  # ── Planetary schematics and industry activities ─────────────────────

  Rule: When every planetary schematic is requested, the SDE provider shall return one record for each loaded schematic.
    A planetary industry planner reads the schematic table whole to lay out
    a production chain.

    Scenario: The two loaded schematics are both returned
      Given a static data provider with the reference data set
      When I look up every planet schematic
      Then the result should contain exactly 2 records
      And the result shall be the records named "Bacteria, Biofuels"

  Rule: When an industry activity ID present in the loaded data set is looked up, the SDE provider shall return the activity record carrying its name.
    A live industry job names its activity by ID; the record gives the name
    an industry tool shows — Manufacturing, Time Efficiency Research.

    Scenario: Industry activity 3 resolves to Time Efficiency Research
      Given a static data provider with the reference data set
      When I look up industry activity 3
      Then the returned record shall be named "Time Efficiency Research"

  Rule: When every industry activity is requested, the SDE provider shall return one record for each loaded activity.
    The activity table is small and read whole to build a job filter.

    Scenario: The two loaded industry activities are both returned
      Given a static data provider with the reference data set
      When I look up every industry activity
      Then the result should contain exactly 2 records
      And the result shall be the records named "Manufacturing, Time Efficiency Research"

  # ── Certificates ─────────────────────────────────────────────────────

  Rule: When a certificate ID present in the loaded data set is looked up, the SDE provider shall return the certificate record carrying its name.
    A certificate groups the skills recommended for a hull at each mastery
    level; the name is what a ship page shows.

    Scenario: Certificate 50 resolves to Core Fitting
      Given a static data provider with the reference data set
      When I look up certificate 50
      Then the returned record shall be named "Core Fitting"

  Rule: When every certificate is requested, the SDE provider shall return one record for each loaded certificate.
    A skill planner reads the certificate table whole to score a character
    against every one.

    Scenario: The two loaded certificates are both returned
      Given a static data provider with the reference data set
      When I look up every certificate
      Then the result should contain exactly 2 records
      And the result shall be the records named "Core Fitting, Core Navigation"

  # ── Type extension tables ────────────────────────────────────────────

  Rule: When the dogma of a type ID present in the loaded data set is looked up, the SDE provider shall return the type dogma record carrying its type ID and its dogma attributes.
    A type's attribute values live in this table rather than on the type
    record; a fitting tool reads them to evaluate a fit.

    Scenario: Type 34 has a dogma record
      Given a static data provider with the reference data set
      When I look up type dogma 34
      Then the returned record shall carry type 34
      And the returned record shall list 1 dogma attribute

  Rule: When the materials of a type ID present in the loaded data set is looked up, the SDE provider shall return the type material record carrying its type ID and its materials.
    Reprocessing yields are the materials on this record; a reprocessing
    calculator reads them by type.

    Scenario: Type 34 has a material record
      Given a static data provider with the reference data set
      When I look up type material 34
      Then the returned record shall carry type 34
      And the returned record shall list 1 material

  Rule: When the bonuses of a type ID present in the loaded data set is looked up, the SDE provider shall return the type bonus record carrying its type ID and its role bonuses.
    A ship's role bonuses are the text a ship page shows under its traits;
    they live in this table, keyed by the hull's type ID.

    Scenario: Type 601 has a bonus record
      Given a static data provider with the reference data set
      When I look up type bonus 601
      Then the returned record shall carry type 601
      And the returned record shall list 1 role bonus

  # ── Absent identifiers ───────────────────────────────────────────────

  Rule: If an industry activity or certificate ID is absent, or a type has no dogma, material or bonus record in the loaded data set, then the SDE provider shall return null.
    Most types have no bonus record and many have no material record, so
    a null answer is ordinary, not a fault.

    Scenario: Unknown industry activity 99 resolves to null
      Given a static data provider with the reference data set
      When I look up industry activity 99
      Then the provider shall return null

    Scenario: Unknown certificate 99 resolves to null
      Given a static data provider with the reference data set
      When I look up certificate 99
      Then the provider shall return null

    Scenario: Type 35 has no dogma record
      Given a static data provider with the reference data set
      When I look up type dogma 35
      Then the provider shall return null

    Scenario: Type 35 has no material record
      Given a static data provider with the reference data set
      When I look up type material 35
      Then the provider shall return null

    Scenario: Type 34 has no bonus record
      Given a static data provider with the reference data set
      When I look up type bonus 34
      Then the provider shall return null
