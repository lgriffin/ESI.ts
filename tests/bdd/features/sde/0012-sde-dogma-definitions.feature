Feature: Dogma Definitions
  Feature 0004 looks up one dogma attribute by ID. The dogma tables also
  define effects — what a module does when activated — and two reference
  tables the attributes point at: the attribute category an attribute is
  grouped under, and the unit its value is expressed in. This feature covers
  those lookups and the name searches over attributes and effects.

  A fitting tool reads the reference tables whole to label and group what
  it displays, and searches by name when a user types an attribute rather
  than picking one.

  # ── Search by name ───────────────────────────────────────────────────

  Rule: When a name fragment is searched for among dogma attributes, the SDE provider shall return the loaded dogma attributes whose names contain that fragment, ignoring letter case, up to the requested limit.
    Dogma attribute names are camel-cased identifiers such as hp or
    shieldCapacity, so a case-insensitive substring match is what lets a
    user find one without knowing its casing. The limit is 25 when the
    caller gives none.

    Scenario: Fragment HP matches the hp attribute
      Given a static data provider with the extended universe data set
      When the user searches for dogma attributes matching "HP"
      Then the provider shall return dogma attributes whose names contain "HP"
      And the result should contain exactly 1 records

  Rule: When a name fragment is searched for among dogma effects, the SDE provider shall return the loaded dogma effects whose names contain that fragment, ignoring letter case, up to the requested limit.
    Effect names follow the same identifier style as attributes, and both
    slot modifiers share the fragment "slot", which is why that fragment
    returns two records here.

    Scenario: Fragment slot matches both slot modifier effects
      Given a static data provider with the extended universe data set
      When the user searches for dogma effects matching "slot"
      Then the provider shall return dogma effects whose names contain "slot"
      And the result should contain exactly 2 records

  # ── Point lookups by identifier ──────────────────────────────────────

  Rule: When a dogma effect ID present in the loaded data set is looked up, the SDE provider shall return the effect record carrying its name and its effect category ID.
    A type's dogma lists effect IDs; the effect record is what tells a
    fitting tool what the module does and, through the category, whether it
    is passive, active or overloaded.

    Scenario: Effect 11 resolves to lowSlotModifier
      Given a static data provider with the extended universe data set
      When I look up dogma effect 11
      Then the provider shall return the dogma effect named "lowSlotModifier"
      And the returned record shall carry effect category 0

  Rule: When a dogma attribute category ID present in the loaded data set is looked up, the SDE provider shall return the category record carrying its name.
    Attribute categories are the headings a fitting window groups attributes
    under — Fitting, Shield, Armor — so the name is the field a caller needs.

    Scenario: Attribute category 1 resolves to Fitting
      Given a static data provider with the extended universe data set
      When I look up dogma attribute category 1
      Then the provider shall return the dogma attribute category named "Fitting"

  Rule: When a dogma unit ID present in the loaded data set is looked up, the SDE provider shall return the unit record carrying its name and its display name.
    An attribute value is meaningless without its unit. The display name is
    the short form a caller prints after the value, such as m or s.

    Scenario: Unit 1 resolves to Length displayed as m
      Given a static data provider with the extended universe data set
      When I look up dogma unit 1
      Then the provider shall return the dogma unit named "Length"
      And the returned unit shall be displayed as "m"

  Rule: If a dogma effect, attribute category or unit ID is absent from the loaded data set, then the SDE provider shall return null.
    Dogma reference IDs on a type may point past a partial extract; the miss
    is an ordinary outcome answered with null.

    Scenario: Unknown dogma effect 99999 resolves to null
      Given a static data provider with the extended universe data set
      When I look up dogma effect 99999
      Then the provider shall return null

    Scenario: Unknown dogma attribute category 99999 resolves to null
      Given a static data provider with the extended universe data set
      When I look up dogma attribute category 99999
      Then the provider shall return null

    Scenario: Unknown dogma unit 99999 resolves to null
      Given a static data provider with the extended universe data set
      When I look up dogma unit 99999
      Then the provider shall return null

  # ── Reference tables read whole ──────────────────────────────────────

  Rule: When every dogma attribute category is requested, the SDE provider shall return one record for each loaded attribute category.
    A fitting window builds its section headings from the whole table, so
    each loaded category appears once.

    Scenario: The two loaded attribute categories are both returned
      Given a static data provider with the extended universe data set
      When I look up every dogma attribute category
      Then the result should contain exactly 2 records
      And the result shall be the records named "Fitting, Shield"

  Rule: When every dogma unit is requested, the SDE provider shall return one record for each loaded unit.
    Units are resolved by ID at display time, so a caller loads the table
    once and indexes it; each loaded unit appears once.

    Scenario: The two loaded units are both returned
      Given a static data provider with the extended universe data set
      When I look up every dogma unit
      Then the result should contain exactly 2 records
      And the result shall be the records named "Length, Time"
