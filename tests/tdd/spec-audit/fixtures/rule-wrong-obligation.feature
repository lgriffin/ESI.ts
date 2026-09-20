Feature: Rule title diluting the obligation keyword
  EARS reserves shall for mandatory behaviour; must, should, may and will all
  leave the reader guessing how binding the requirement is.

  Rule: The ETag cache shall store the response body that the client must revalidate.
    Rationale prose.

    Scenario: A response carrying an ETag is stored
      Given a response with an ETag header
      When the client issues the request
      Then the ETag cache holds an entry for that request
