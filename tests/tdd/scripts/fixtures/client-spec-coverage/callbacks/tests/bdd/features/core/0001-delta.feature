Feature: Delta
  Rule: When the delta client is exercised, it shall answer.
    Scenario: exercised
      Given a delta client
      When the delta client is exercised as "table"
