Feature: Consistent specimen
  The same Rule as the inconsistent specimen, qualified so that it promises
  only what the clone schema guarantees. It guards the other direction: a check
  that reports clean input is as broken as one that stops reporting.

  Rule: When clone information is requested for a character ID, the Clones client shall return a record carrying one entry per jump clone and the home location when present.
    The home location is optional in the schema, and the title now says so.

    Scenario: Clone information for a character with jump clones
      Given a character with two jump clones
      When the client requests clone information
      Then the record carries both jump clones
