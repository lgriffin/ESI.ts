Feature: Unwanted-behaviour Rule with no condition
  An If pattern whose condition is empty states an unconditional requirement
  while pretending to state a conditional one.

  Rule: If, then the ETag cache shall store no entry for that request.
    Rationale prose.

    Scenario: A response without an ETag is not stored
      Given a response without an ETag header
      When the client issues the request
      Then the ETag cache holds no entry for that request
