Feature: Fixture boundary

  @sec-P1
  Rule: If a request leaves the host, then the client shall not send the token.

    Scenario: Token stays home
      Given a thing
      Then nothing leaks

  @sec-P2
  Rule: If ESI reports more than 1000 pages, then the client shall request no more than 1000 pages.

    Scenario: Pages are bounded
      Given a thing
      Then nothing leaks
