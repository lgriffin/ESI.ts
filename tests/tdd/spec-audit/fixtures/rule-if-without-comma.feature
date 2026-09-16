Feature: Unwanted-behaviour Rule missing the comma before then
  Without the comma the title reads as one run-on phrase and the condition
  stops being separable from the response.

  Rule: If a response omits the ETag header then the ETag cache shall store no entry for that request.
    Rationale prose.

    Scenario: A response without an ETag is not stored
      Given a response without an ETag header
      When the client issues the request
      Then the ETag cache holds no entry for that request
