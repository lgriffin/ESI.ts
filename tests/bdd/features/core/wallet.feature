Feature: Wallet Management

  Scenario: Get ISK balance for a character
    Given an authenticated character for wallet
    When I request their wallet balance
    Then I should receive the ISK amount

  Scenario: Character with zero ISK balance
    Given a character with no ISK
    When I request the zero balance
    Then I should receive zero

  Scenario: Get journal entries for a character
    Given an authenticated character with transaction history
    When I request their wallet journal
    Then I should receive journal entries

  Scenario: Empty journal for a new character
    Given a new character with no activity
    When I request the new character wallet journal
    Then I should receive an empty journal array

  Scenario: Get market transactions for a character
    Given an authenticated character with market activity
    When I request their transactions
    Then I should receive transaction records

  Scenario: Get corporation wallet divisions
    Given an authenticated director
    When I request corporation wallets
    Then I should receive all wallet divisions

  Scenario: Get corporation wallet journal for a specific division
    Given an authenticated director for journal
    When I request the journal for division 1
    Then I should receive journal entries for that division

  Scenario: Get corporation wallet transactions for a specific division
    Given an authenticated director for transactions
    When I request transactions for division 1
    Then I should receive corporation transaction records

  Scenario: Unauthorized access to character wallet (403)
    Given an unauthenticated user for character wallet
    When I request a character wallet balance without auth
    Then I should receive a 403 forbidden error for character wallet

  Scenario: Unauthorized access to corporation wallet (403)
    Given a non-director character for corporation wallet
    When I request corporation wallets without auth
    Then I should receive a 403 forbidden error for corporation wallet

  Scenario: Fetch balance, journal, and transactions simultaneously
    Given an authenticated character for concurrent wallet ops
    When I fetch balance, journal, and transactions concurrently
    Then all wallet data should complete successfully

  Scenario: Build a complete financial summary for a character
    Given an authenticated character with financial history
    When I gather all financial data
    Then I should be able to compute a financial summary
