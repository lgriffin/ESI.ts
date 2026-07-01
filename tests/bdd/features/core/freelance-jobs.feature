Feature: Freelance Jobs Management

  # EARS: Event-driven
  Scenario: WHEN getting freelance jobs listing, the client shall return the data
    Given publicly available freelance jobs exist
    When the client requests the job listing
    Then the client shall return jobs with pagination cursors

  # EARS: State-driven
  Scenario: WHILE no freelance jobs available, the client shall return an empty result
    Given no freelance jobs exist
    When the client requests the empty job listing
    Then the client shall return an empty listing

  # EARS: Event-driven
  Scenario: WHEN getting a specific freelance job by ID, the client shall return the data
    Given a valid job ID
    When the client requests the job details
    Then the client shall return the full job information

  # EARS: Unwanted
  Scenario: IF requesting a non-existent job, THEN the client shall return a not-found error
    Given an invalid job ID
    When the client requests details for the invalid job
    Then the client shall return a 404 error for the job

  # EARS: Event-driven
  Scenario: WHEN getting character freelance jobs, the client shall return the data
    Given an authenticated character with freelance jobs
    When the client requests their job listing
    Then the client shall return the character jobs with cursors

  # EARS: Event-driven
  Scenario: WHEN getting character participation in a specific job, the client shall return the data
    Given a character participating in a job
    When the client requests their participation details
    Then the client shall return contribution data

  # EARS: Event-driven
  Scenario: WHEN getting corporation freelance jobs, the client shall return the data
    Given an authenticated corporation for freelance jobs
    When the client requests their freelance jobs
    Then the client shall return the corporation jobs listing

  # EARS: Event-driven
  Scenario: WHEN paginating forward through freelance jobs, the client shall return the correct page
    Given a first page with an after cursor
    When the client requests the next page using the after token
    Then the client shall return the second page of results

  # EARS: Event-driven
  Scenario: WHEN paginating backward through freelance jobs, the client shall return the correct page
    Given a second page with a before cursor
    When the client requests the previous page using the before token
    Then the client shall return the first page of results

  # EARS: Unwanted
  Scenario: IF unauthorized access to character freelance jobs, THEN the client shall return a forbidden error
    Given an invalid token for freelance jobs
    When the client requests character freelance jobs with invalid token
    Then the client shall return a 403 forbidden error for freelance jobs
