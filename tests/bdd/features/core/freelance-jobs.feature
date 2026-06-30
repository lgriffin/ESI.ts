Feature: Freelance Jobs Management

  Scenario: Get freelance jobs listing
    Given publicly available freelance jobs exist
    When I request the job listing
    Then I should receive jobs with pagination cursors

  Scenario: No freelance jobs available
    Given no freelance jobs exist
    When I request the empty job listing
    Then I should receive an empty listing

  Scenario: Get a specific freelance job by ID
    Given a valid job ID
    When I request the job details
    Then I should receive the full job information

  Scenario: Request a non-existent job
    Given an invalid job ID
    When I request details for the invalid job
    Then I should receive a 404 error for the job

  Scenario: Get character freelance jobs
    Given an authenticated character with freelance jobs
    When I request their job listing
    Then I should receive the character jobs with cursors

  Scenario: Get character participation in a specific job
    Given a character participating in a job
    When I request their participation details
    Then I should receive contribution data

  Scenario: Get corporation freelance jobs
    Given an authenticated corporation for freelance jobs
    When I request their freelance jobs
    Then I should receive the corporation jobs listing

  Scenario: Paginate forward through freelance jobs
    Given a first page with an after cursor
    When I request the next page using the after token
    Then I should receive the second page of results

  Scenario: Paginate backward through freelance jobs
    Given a second page with a before cursor
    When I request the previous page using the before token
    Then I should receive the first page of results

  Scenario: Unauthorized access to character freelance jobs
    Given an invalid token for freelance jobs
    When I request character freelance jobs with invalid token
    Then I should receive a 403 forbidden error for freelance jobs
