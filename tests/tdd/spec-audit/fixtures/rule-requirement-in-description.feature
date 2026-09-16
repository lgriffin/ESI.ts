Feature: Requirement buried in the rationale prose
  A requirement in the description is one no scenario is traceable to, so it
  belongs in a Rule title of its own.

  Rule: When a response carries an ETag header, the ETag cache shall store the response body against that ETag.
    The ETag cache shall also evict the entry once its TTL expires.

    Scenario: A response carrying an ETag is stored
      Given a response with an ETag header
      When the client issues the request
      Then the ETag cache holds an entry for that request
