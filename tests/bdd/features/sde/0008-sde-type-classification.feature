Feature: Type Classification
  Every item in EVE sits in exactly one group, and every group in exactly one
  category; the SDE stores the two links as foreign keys on the type and the
  group. Beside the point lookups of 0001, the SDE provider answers the
  reverse questions: which types a group holds, which groups a category
  holds, and what the full set of categories is.

  These are the lookups a market browser or a fitting tool walks downward,
  so a parent with nothing beneath it is an ordinary answer — an empty list —
  rather than a missing record.

  # ── Types of a group ─────────────────────────────────────────────────

  Rule: When a group ID is looked up for its types, the SDE provider shall return every loaded type whose group ID is that group.
    The group is the level a caller filters on when it wants "all minerals"
    or "all frigates". Each returned type carries the group ID it was matched
    on, which is what lets the caller confirm nothing from another group
    leaked in.

    Scenario: Group 18 holds the three loaded minerals
      Given a static data provider with the extended universe data set
      When I look up types in group 18
      Then the result should contain exactly 3 records
      And each type should belong to group 18

    Scenario: Group 25 exists but holds no loaded types
      Given a static data provider with the extended universe data set
      When I look up types in group 25
      Then the provider shall return an empty list

  # ── Groups of a category ─────────────────────────────────────────────

  Rule: When a category ID is looked up for its groups, the SDE provider shall return every loaded group whose category ID is that category.
    Categories are coarse — Ship, Module, Material — so a caller expanding
    one expects the groups beneath it and nothing else. A category with no
    groups loaded is still a category, and answers with an empty list.

    Scenario: Category 4 holds the Mineral group
      Given a static data provider with the extended universe data set
      When I look up groups in category 4
      Then the result should contain exactly 1 records
      And each group should belong to category 4

    Scenario: Category 2 exists but holds no loaded groups
      Given a static data provider with the extended universe data set
      When I look up groups in category 2
      Then the provider shall return an empty list

  # ── Every category ───────────────────────────────────────────────────

  Rule: When every category is requested, the SDE provider shall return one record for each loaded category.
    The category list is small and fixed, so callers read it whole to build
    a top-level menu. Each loaded category appears once; the count and the
    names together show that none was dropped or duplicated.

    Scenario: The three loaded categories are all returned
      Given a static data provider with the extended universe data set
      When I look up every category
      Then the result should contain exactly 3 records
      And the result shall be the records named "Celestial, Material, Ship"

  # ── Order of a collection ────────────────────────────────────────────

  Rule: When a table or the records of a parent are read, the SDE provider shall return them ordered by ID ascending.
    CCP's export lists records in no promised order, and the two providers
    used to keep whichever order they loaded. A caller paging a table or
    diffing two builds needs one order it can rely on, so both providers sort
    each table by ID once at load time and every whole-table and foreign-key
    answer reads in that order.

    Scenario: Categories loaded in descending order come back ascending
      Given a static data provider whose categories and types were loaded in descending ID order
      When I look up every category
      Then the returned records shall be ordered by "categoryId" ascending

    Scenario: The types of a group loaded in descending order come back ascending
      Given a static data provider whose categories and types were loaded in descending ID order
      When I look up types in group 18
      Then the returned records shall be ordered by "typeId" ascending
