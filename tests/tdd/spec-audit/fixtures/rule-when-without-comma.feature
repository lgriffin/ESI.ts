Feature: Event-driven Rule missing the comma after its trigger
  The comma is what marks where the trigger ends and the constrained system
  begins.

  Rule: When a response carries an ETag header the ETag cache shall store the response body.
    Rationale prose.

    Scenario: A response carrying an ETag is stored
      Given a response with an ETag header
      When the client issues the request
      Then the ETag cache holds an entry for that request
