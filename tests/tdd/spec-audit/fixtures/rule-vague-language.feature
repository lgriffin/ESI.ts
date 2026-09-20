Feature: Rule title using unmeasurable language
  If two readers can disagree about whether the system met the requirement,
  it is not a requirement.

  Rule: When a response omits the ETag header, the ETag cache shall handle the response gracefully.
    Rationale prose.

    Scenario: A response without an ETag is not stored
      Given a response without an ETag header
      When the client issues the request
      Then the ETag cache holds no entry for that request
