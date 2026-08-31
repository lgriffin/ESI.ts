Feature: Corporation Management

  # EARS: Event-driven
  Scenario: WHEN retrieving corporation public profile, the client shall return the data
    Given a valid corporation ID
    When the client requests public information
    Then the client shall return complete corporation profile

  # EARS: Unwanted
  Scenario: IF non-existent corporation, THEN the client shall return a not-found error
    Given an invalid corporation ID
    When the client requests public information for the invalid corporation
    Then the client shall return a not found error

  # EARS: Event-driven
  Scenario: WHEN retrieving corporation members, the client shall return the data
    Given an authenticated corporation director
    When the client requests member list
    Then the client shall return member character IDs

  # EARS: Event-driven
  Scenario: WHEN retrieving member roles, the client shall return the data
    Given an authenticated corporation director for roles
    When the client requests member roles
    Then the client shall return role assignments

  # EARS: Event-driven
  Scenario: WHEN retrieving corporation assets, the client shall return the data
    Given an authenticated corporation member
    When the client requests assets
    Then the client shall return corporation inventory

  # EARS: Event-driven
  Scenario: WHEN retrieving corporation structures, the client shall return the data
    Given an authenticated corporation director for structures
    When the client requests structures
    Then the client shall return structure information

  # EARS: Event-driven
  Scenario: WHEN retrieving corporation wallets, the client shall return the data
    Given an authenticated corporation accountant
    When the client requests wallets
    Then the client shall return wallet divisions

  # EARS: Event-driven
  Scenario: WHEN retrieving wallet journal, the client shall return the data
    Given an authenticated corporation accountant for journal
    When the client requests wallet journal
    Then the client shall return transaction history

  # EARS: Unwanted
  Scenario: IF insufficient permissions, THEN the client shall return a forbidden error
    Given a member without director roles
    When the client accesses restricted data
    Then the client shall return a forbidden error

  # EARS: Unwanted
  Scenario: IF invalid authentication, THEN the client shall return an authentication error
    Given invalid authentication credentials
    When the client accesses corporation data
    Then the client shall return an authentication error

  # EARS: Ubiquitous
  Scenario: The client shall handle large corporation data sets
    Given a large corporation with many members
    When the client requests member data
    Then the client shall handle large data sets efficiently

  # EARS: Ubiquitous
  Scenario: The client shall handle concurrent corporation requests
    Given multiple concurrent corporation data requests
    When the client makes them simultaneously
    Then all requests shall complete successfully

  # EARS: Event-driven
  Scenario: WHEN completing corporation profile assembly, the client shall complete all steps
    Given a corporation ID for profile assembly
    When the client gathers complete corporation data
    Then the client shall successfully retrieve all corporation information
