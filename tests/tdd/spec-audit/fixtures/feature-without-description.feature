Feature: Feature with no description

  Rule: When a response carries an ETag header, the ETag cache shall store the response body against that ETag.
    Rationale prose.

    Scenario: A response carrying an ETag is stored
      Given a response with an ETag header
      When the client issues the request
      Then the ETag cache holds an entry for that request
