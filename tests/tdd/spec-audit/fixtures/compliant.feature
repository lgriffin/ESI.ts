Feature: Compliant specimen
  A fixture that satisfies every audit check. It guards the other direction
  from the negative fixtures: an audit that starts reporting findings against
  clean input is as broken as one that stops reporting them.

  Rule: When a response carries an ETag header, the ETag cache shall store the response body against that ETag.
    The rationale belongs here and states no further requirement, so every
    requirement in the file is traceable to exactly one Rule title.

    Scenario: A response carrying an ETag is stored
      Given a response with an ETag header
      When the client issues the request
      Then the ETag cache holds an entry for that request
