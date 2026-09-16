Feature: Scenario with no requirement above it
  A scenario at feature level verifies nothing that the specification states,
  so either the requirement is missing or the scenario is. Gherkin binds by
  keyword rather than indentation, so the unattached scenario has to come
  before the first Rule.

  Scenario: An unattached scenario
    Given a response without an ETag header
    When the client issues the request
    Then the ETag cache holds no entry for that request

  Rule: When a response carries an ETag header, the ETag cache shall store the response body against that ETag.
    Rationale prose.

    Scenario: A response carrying an ETag is stored
      Given a response with an ETag header
      When the client issues the request
      Then the ETag cache holds an entry for that request
