Feature: Bug with nowhere to look it up
  A scenario tagged as a bug with no tracker reference records a known defect
  and hides where its history lives.

  Rule: When a response carries an ETag header, the ETag cache shall store the response body against that ETag.
    Rationale prose.

    @bug
    Scenario: A known defect with no tracker
      Given a response with an ETag header
      When the client issues the request
      Then the ETag cache holds an entry for that request
