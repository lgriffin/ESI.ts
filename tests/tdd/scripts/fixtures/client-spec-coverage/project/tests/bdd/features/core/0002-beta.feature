Feature: Beta
  Rule: When the beta client is called by a legacy scenario, it shall answer.
    Scenario: A legacy call
      Given two clients
      When beta is called

    Scenario Outline: A looped call for <label>
      Given two clients
      When beta is called in a loop

      Examples:
        | label |
        | one   |

    Scenario: A second looped call
      Given two clients
      When beta is called in a loop
