Feature: Static Data Lookup
  The SDE provider serves EVE's Static Data Export from an in-memory data set,
  answering point lookups by primary key and name searches over loaded types.
  Every record is keyed by the same ID the ESI API uses, so a caller can join
  live API responses to static data without a translation layer.

  Records also reference one another by ID — a type names its group, a group
  its category, a region its constellations — and the provider exposes those
  links as further lookups rather than embedding nested objects.

  # ── Point lookup by identifier ───────────────────────────────────────

  Rule: When a type ID present in the loaded data set is looked up, the SDE provider shall return the type record carrying its type ID, name, group ID, and published flag.
    A type is the atom of the SDE: almost every other lookup starts from one.
    The four fields asserted here are the ones the rest of the library relies
    on, so a record missing any of them is not usable even if the lookup
    itself succeeded.

    Scenario: Type ID 34 resolves to the Tritanium record
      Given an SDE provider with Tritanium loaded
      When the user looks up type ID 34
      Then the provider shall return Tritanium with correct attributes

  Rule: If a type ID is absent from the loaded data set, then the SDE provider shall return null.
    A missing record is an ordinary outcome, not a fault — the data set may be
    a partial extract, and EVE retires type IDs over time. Returning null
    rather than throwing keeps the caller's control flow simple.

    Scenario: Unknown type ID 999999 resolves to null
      Given an SDE provider with test data
      When the user looks up a non-existent type ID
      Then the provider shall return null

  # ── Search by name ───────────────────────────────────────────────────

  Rule: When a name fragment is searched for, the SDE provider shall return every loaded type whose name contains that fragment, ignoring letter case.
    Callers translate user input — a partial item name typed into a search
    box — into type IDs. Matching on a case-insensitive substring is what
    makes that usable without the caller knowing EVE's exact capitalisation.

    Scenario: Fragment Trit matches every loaded type containing it
      Given an SDE provider with multiple types loaded
      When the user searches for types matching "Trit"
      Then the provider shall return types whose names contain "Trit"

  # ── Traversing record references ─────────────────────────────────────

  Rule: When a type's group ID and that group's category ID are looked up in turn, the SDE provider shall return the group record and the category record those IDs identify.
    The type-group-category chain is how the SDE classifies every item in the
    game. Each step is a separate lookup by ID, so the chain holds only if
    the foreign keys on each record point at records the provider can find.

    Scenario: Tritanium resolves through group Mineral to category Material
      Given an SDE provider with a complete type hierarchy
      When the user looks up a type and navigates to its group and category
      Then the provider shall return the correct group and category

  Rule: When the universe hierarchy is traversed downward from a region ID, the SDE provider shall return the constellations of that region and the solar systems of each of those constellations.
    Geography is stored as three levels of containment rather than as nested
    documents, so a caller walks it one level at a time. The Forge exercises
    the full descent because its contents are well known: Kimotoro holds
    Jita.

    Scenario: The Forge descends to Kimotoro constellation and Jita solar system
      Given an SDE provider with The Forge region data loaded
      When the user looks up the region and navigates through constellations and systems
      Then the provider shall return Kimotoro constellation and Jita solar system

  Rule: When a solar system ID is looked up, the SDE provider shall return the stargates of that system, each carrying a destination solar system ID and a destination stargate ID.
    Stargates are the edges of EVE's travel graph. A stargate is only useful
    if both ends of the edge are present, which is why the destination pair
    is asserted rather than the stargate record alone.

    Scenario: Jita stargates carry a destination system and stargate ID
      Given an SDE provider with stargate data for Jita
      When the user looks up stargates for Jita
      Then the provider shall return at least one stargate with a destination
