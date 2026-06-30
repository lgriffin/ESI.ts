Feature: Mail Management

  Scenario: Retrieve mail inbox headers
    Given an authenticated character with mail
    When I request their inbox headers
    Then I should receive a list of mail summaries

  Scenario: Empty inbox
    Given an authenticated character with no mail
    When I request their empty inbox headers
    Then I should receive an empty mail list

  Scenario: Read a single mail message
    Given a character with a specific mail
    When I request the full mail
    Then I should receive the complete message with body

  Scenario: Retrieve mail labels with unread counts
    Given an authenticated character with mail labels
    When I request their mail labels
    Then I should receive labels with unread counts

  Scenario: Create a custom mail label
    Given an authenticated character for label creation
    When I create a new mail label
    Then I should receive the new label ID

  Scenario: Delete a custom mail label
    Given an authenticated character with a custom label
    When I delete the mail label
    Then the delete label operation should complete without error

  Scenario: Retrieve subscribed mailing lists
    Given an authenticated character subscribed to mailing lists
    When I request their mailing lists
    Then I should receive the mailing list details

  Scenario: Send a new mail
    Given an authenticated character for sending mail
    When I send a mail to another character
    Then I should receive the new mail ID

  Scenario: Delete a mail
    Given an authenticated character with a mail to delete
    When I delete the mail
    Then the delete mail operation should complete without error

  Scenario: Update mail metadata to mark as read
    Given an unread mail
    When I update its metadata to mark it as read
    Then the update metadata operation should complete without error

  Scenario: Fetch headers, labels, and mailing lists simultaneously
    Given an authenticated character for concurrent mail fetch
    When I fetch headers, labels, and lists concurrently
    Then all three mail requests should resolve successfully

  Scenario: Handle unauthorized access to mail
    Given an unauthenticated mail request
    When I request mail headers without auth
    Then I should receive a 403 forbidden error for mail

  Scenario: Handle not found error for non-existent mail
    Given a mail ID that does not exist
    When I request the non-existent mail
    Then I should receive a 404 not found error for mail
