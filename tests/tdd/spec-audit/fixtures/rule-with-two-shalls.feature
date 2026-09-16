Feature: Rule title stating two requirements
  Two behaviours in one title cannot be traced to one scenario set, so the
  audit insists on exactly one shall per Rule.

  Rule: The ETag cache shall store the response body and the retry strategy shall pause between attempts.
    Rationale prose.

    Scenario: A response carrying an ETag is stored
      Given a response with an ETag header
      When the client issues the request
      Then the ETag cache holds an entry for that request
