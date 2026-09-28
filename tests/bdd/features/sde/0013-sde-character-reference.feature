Feature: Character Reference Tables
  Feature 0005 walks the character origin chain from a race down to its
  ancestries and looks one faction up by ID. This feature covers the rest of
  the character reference data: the faction and race tables read whole, a
  bloodline or ancestry looked up by its own ID, and the three small tables a
  character sheet draws on — character attributes, clone grades and schools.

  A character tool holds these IDs from live API responses (a public
  character record names its race, bloodline and ancestry) and turns them
  into names and descriptions through these lookups.

  # ── Whole tables ─────────────────────────────────────────────────────

  Rule: When every faction is requested, the SDE provider shall return one record for each loaded faction.
    The faction table is small and is read whole to label sovereignty,
    militias and NPC corporations. Each loaded faction appears once, whether
    or not any NPC corporation of it is loaded.

    Scenario: The two loaded factions are both returned
      Given a static data provider with the reference data set
      When I look up every faction
      Then the result should contain exactly 2 records
      And the result shall be the records named "Caldari State, Gallente Federation"

  Rule: When every race is requested, the SDE provider shall return one record for each loaded race.
    The four playable races are the first choice a character makes, and a
    character creator or a filter reads the table whole.

    Scenario: The two loaded races are both returned
      Given a static data provider with the reference data set
      When I look up every race
      Then the result should contain exactly 2 records
      And the result shall be the records named "Caldari, Gallente"

  Rule: When every character attribute is requested, the SDE provider shall return one record for each loaded attribute.
    The five character attributes govern skill training speed; a skill
    planner reads the table whole to label them.

    Scenario: The two loaded character attributes are both returned
      Given a static data provider with the reference data set
      When I look up every character attribute
      Then the result should contain exactly 2 records
      And the result shall be the records named "Charisma, Intelligence"

  Rule: When every clone grade is requested, the SDE provider shall return one record for each loaded clone grade.
    Clone grades decide which skills a character may train; the table is
    read whole to explain an account state.

    Scenario: The two loaded clone grades are both returned
      Given a static data provider with the reference data set
      When I look up every clone grade
      Then the result should contain exactly 2 records
      And the result shall be the records named "Alpha Clone, Omega Clone"

  Rule: When every school is requested, the SDE provider shall return one record for each loaded school.
    Schools are the starting corporations of new characters and are read
    whole for a character creator's picker.

    Scenario: The two loaded schools are both returned
      Given a static data provider with the reference data set
      When I look up every school
      Then the result should contain exactly 2 records
      And the result shall be the records named "School of Applied Knowledge, Science and Trade Institute"

  # ── Point lookups by identifier ──────────────────────────────────────

  Rule: When a bloodline ID present in the loaded data set is looked up, the SDE provider shall return the bloodline record carrying its name and its race ID.
    Feature 0005 lists the bloodlines of a race; this lookup answers for one
    bloodline by its own ID, which is what a character record carries. The
    race ID on the record walks back up the origin chain.

    Scenario: Bloodline 1 resolves to Deteis
      Given a static data provider with the reference data set
      When I look up bloodline 1
      Then the returned record shall be named "Deteis"
      And the returned record shall carry race 1

  Rule: When an ancestry ID present in the loaded data set is looked up, the SDE provider shall return the ancestry record carrying its name and its bloodline ID.
    An ancestry is the leaf of the origin chain and the ID a character
    record carries; the bloodline ID links it back to its bloodline.

    Scenario: Ancestry 1 resolves to Tube Child
      Given a static data provider with the reference data set
      When I look up ancestry 1
      Then the returned record shall be named "Tube Child"
      And the returned record shall carry bloodline 1

  Rule: When a character attribute ID present in the loaded data set is looked up, the SDE provider shall return the attribute record carrying its name.
    A skill names its primary and secondary attribute by ID; the record
    gives the name a skill planner displays.

    Scenario: Character attribute 1 resolves to Intelligence
      Given a static data provider with the reference data set
      When I look up character attribute 1
      Then the returned record shall be named "Intelligence"

  Rule: When a clone grade ID present in the loaded data set is looked up, the SDE provider shall return the clone grade record carrying its name.
    An account state names its clone grade by ID; the record gives the name
    to display and the skill limits to apply.

    Scenario: Clone grade 2 resolves to Omega Clone
      Given a static data provider with the reference data set
      When I look up clone grade 2
      Then the returned record shall be named "Omega Clone"

  Rule: When a school ID present in the loaded data set is looked up, the SDE provider shall return the school record carrying its name and its corporation ID.
    A character record names its school by ID; the corporation ID is the
    NPC corporation the character started in.

    Scenario: School 1 resolves to the School of Applied Knowledge
      Given a static data provider with the reference data set
      When I look up school 1
      Then the returned record shall be named "School of Applied Knowledge"
      And the returned record shall carry corporation 1000044

  # ── Absent identifiers ───────────────────────────────────────────────

  Rule: If a bloodline, ancestry, character attribute, clone grade or school ID is absent from the loaded data set, then the SDE provider shall return null.
    These tables are small and stable, but a partial extract may omit any
    of them, and null rather than an exception is the answer for a record
    that is not loaded.

    Scenario: Unknown bloodline 99 resolves to null
      Given a static data provider with the reference data set
      When I look up bloodline 99
      Then the provider shall return null

    Scenario: Unknown ancestry 99 resolves to null
      Given a static data provider with the reference data set
      When I look up ancestry 99
      Then the provider shall return null

    Scenario: Unknown character attribute 99 resolves to null
      Given a static data provider with the reference data set
      When I look up character attribute 99
      Then the provider shall return null

    Scenario: Unknown clone grade 99 resolves to null
      Given a static data provider with the reference data set
      When I look up clone grade 99
      Then the provider shall return null

    Scenario: Unknown school 99 resolves to null
      Given a static data provider with the reference data set
      When I look up school 99
      Then the provider shall return null
