Feature: Inconsistent specimen
  A domain feature whose Rule promises a field the clone schema lets ESI omit.
  The file name maps it to cloneEndpoints.ts, exactly as a real domain
  feature is mapped.

  Rule: When clone information is requested for a character ID, the Clones client shall return a record carrying the home location and one entry per jump clone.
    The home location is optional in the schema, so this title promises more
    than the pipeline guarantees.

    Scenario: Clone information for a character with jump clones
      Given a character with two jump clones
      When the client requests clone information
      Then the record carries both jump clones
