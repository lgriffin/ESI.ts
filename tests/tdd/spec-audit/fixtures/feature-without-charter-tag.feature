Feature: Feature tracing to no charter requirement
  A feature with no charter tag on the Feature or any Rule cannot be traced to
  the requirement it verifies, so its passing scenarios count as evidence for
  nothing in guides/CHARTER.md.

  Rule: When a response carries an ETag header, the ETag cache shall store the response body against that ETag.
    Rationale prose.

    Scenario: A response carrying an ETag is stored
      Given a response with an ETag header
      When the client issues the request
      Then the ETag cache holds an entry for that request
