Feature: Market Group Hierarchy Navigation
  EVE's market browser is a tree of market groups, and the SDE stores that
  tree as a flat table where each group names its parent. The SDE provider
  turns the flat table back into a navigable tree with two lookups: fetch the
  roots, then fetch the children of any group.

  Callers use this to render a market browser or to resolve a type to the
  branch of the tree it is sold under, which needs the parent link to be
  reliable in both directions.

  # ── Tree roots ───────────────────────────────────────────────────────

  Rule: When the root market groups are requested, the SDE provider shall return only the market groups whose parent group ID is null.
    A null parent is what marks a group as a top-level branch of the market
    tree. Any group with a parent appearing in this result would give a
    caller a duplicated branch when it later expands that parent.

    Scenario: Every root market group has a null parent
      Given a static data provider with hierarchical test data
      When I look up root market groups
      Then each market group should have null parent group ID

  # ── Descending the tree ──────────────────────────────────────────────

  Rule: When a market group ID is supplied as a parent, the SDE provider shall return the market groups that record that ID as their parent group.
    This is the expansion step of the tree walk. Group 1031 is the root
    Manufacture & Research branch, whose children include Minerals, so a
    caller descending from it reaches the groups that hold tradeable types.

    Scenario: Parent group 1031 yields the Minerals child group
      Given a static data provider with hierarchical test data
      When I look up market groups with parent 1031
      Then the result should contain at least 1 market group
      And the first group name should be "Minerals"
