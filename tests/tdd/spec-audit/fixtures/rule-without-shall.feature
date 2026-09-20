Feature: Rule title that is not a requirement
  The Rule title is the requirement, so a title with no obligation keyword
  states nothing for its scenarios to verify.

  Rule: The ETag cache stores the response body against the ETag.
    Rationale prose.

    Scenario: A response carrying an ETag is stored
      Given a response with an ETag header
      When the client issues the request
      Then the ETag cache holds an entry for that request
