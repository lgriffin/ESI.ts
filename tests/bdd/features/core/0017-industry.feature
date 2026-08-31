Feature: Industry Management

  # EARS: Event-driven
  Scenario: WHEN getting character industry jobs, the client shall return the data
    Given a character with active industry jobs
    When the client requests their industry jobs
    Then the client shall return job details including status and blueprint info

  # EARS: State-driven
  Scenario: WHILE the character has no industry jobs, the client shall return an empty result
    Given a character with no industry jobs
    When the client requests their industry jobs
    Then the client shall return an empty array

  # EARS: Event-driven
  Scenario: WHEN getting corporation industry jobs, the client shall return the data
    Given a corporation with running industry jobs
    When the client requests the corporation industry jobs
    Then the client shall return the full list of corporation jobs

  # EARS: Event-driven
  Scenario: WHEN getting publicly available industry facilities, the client shall return the data
    Given industry facilities exist in the universe
    When the client requests the facility list
    Then the client shall return facilities with location and tax info

  # EARS: Event-driven
  Scenario: WHEN getting industry system cost indices, the client shall return the data
    Given solar systems with industry activity
    When the client requests system indices
    Then the client shall return cost index data per activity

  # EARS: Event-driven
  Scenario: WHEN getting character mining ledger, the client shall return the data
    Given a character who has been mining
    When the client requests their mining ledger
    Then the client shall return daily ore quantities

  # EARS: Event-driven
  Scenario: WHEN getting corporation mining observers, the client shall return the data
    Given a corporation with mining observers
    When the client requests the observer list
    Then the client shall return observer details

  # EARS: Event-driven
  Scenario: WHEN getting mining observer details, the client shall return the data
    Given a valid mining observer
    When the client requests the observer activity
    Then the client shall return character mining entries

  # EARS: Unwanted
  Scenario: IF unauthorized access to industry jobs, THEN the client shall return a forbidden error
    Given an invalid or expired token
    When the client requests character industry jobs
    Then the client shall return a 403 forbidden error for industry jobs

  # EARS: Unwanted
  Scenario: IF unauthorized access to corporation mining data, THEN the client shall return a forbidden error
    Given insufficient corporation roles
    When the client requests mining observers
    Then the client shall return a 403 forbidden error for mining observers

  # EARS: Ubiquitous
  Scenario: The client shall fetch character jobs, facilities, and systems concurrently
    Given an authenticated character for concurrent industry fetch
    When the client fetches industry jobs, facilities, and systems in parallel
    Then all three industry requests shall resolve successfully
