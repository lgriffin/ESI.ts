Feature: Rule title pointing at the system instead of naming it
  A requirement that says "it shall" leaves the constrained system to be
  inferred from context, which is exactly what a specification must not do.

  Rule: When a response omits the ETag header, it shall store no entry for that request.
    Rationale prose.

    Scenario: A response without an ETag is not stored
      Given a response without an ETag header
      When the client issues the request
      Then the ETag cache holds no entry for that request
