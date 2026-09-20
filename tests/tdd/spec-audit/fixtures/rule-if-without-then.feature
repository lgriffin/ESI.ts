Feature: Unwanted-behaviour Rule missing its then
  The If pattern is the only EARS template that takes then, and then must
  separate the condition from the response.

  Rule: If a response omits the ETag header the ETag cache shall store no entry for that request.
    Rationale prose.

    Scenario: A response without an ETag is not stored
      Given a response without an ETag header
      When the client issues the request
      Then the ETag cache holds no entry for that request
