@TEST-02
Feature: Rule tagged with a charter id the charter does not define
  A charter tag naming a retired or mistyped requirement is a trace that
  leads nowhere, however well the Rule beneath it is written.

  @TEST-99
  Rule: When a response carries an ETag header, the ETag cache shall store the response body against that ETag.
    Rationale prose.

    Scenario: A response carrying an ETag is stored
      Given a response with an ETag header
      When the client issues the request
      Then the ETag cache holds an entry for that request
