Feature: Alpha
  Rule: When getNamedBare is called, the alpha client shall answer.
    Scenario: named in the rule only
      Given two clients
      Then others are touched
      And nothing is overridden

  Rule: When BetaClient.getQualified is called, the beta client shall answer, and getAmbiguous shall not be credited to either client.
    Scenario: qualified in the rule
      Given two clients
      Then nothing is overridden

  Rule: When the alpha client is called, it shall answer.
    Scenario: direct call
      Given two clients
      When alpha is called directly

    Scenario: through support
      Given two clients
      When the chain is walked 2 times

    Scenario: through a mapped type
      Given two clients
      When alpha is metered
