Feature: Mail Management

  # EARS: Event-driven
  Scenario: WHEN retrieving mail inbox headers, the client shall return the data
    Given an authenticated character with mail
    When the client requests their inbox headers
    Then the client shall return a list of mail summaries

  # EARS: State-driven
  Scenario: WHILE empty inbox, the client shall return an empty result
    Given an authenticated character with no mail
    When the client requests their empty inbox headers
    Then the client shall return an empty mail list

  # EARS: Event-driven
  Scenario: WHEN reading a single mail message, the client shall return the full content
    Given a character with a specific mail
    When the client requests the full mail
    Then the client shall return the complete message with body

  # EARS: Event-driven
  Scenario: WHEN retrieving mail labels with unread counts, the client shall return the data
    Given an authenticated character with mail labels
    When the client requests their mail labels
    Then the client shall return labels with unread counts

  # EARS: Event-driven
  Scenario: WHEN creating a custom mail label, the client shall create the resource
    Given an authenticated character for label creation
    When the client creates a new mail label
    Then the client shall return the new label ID

  # EARS: Event-driven
  Scenario: WHEN deleting a custom mail label, the client shall complete the operation
    Given an authenticated character with a custom label
    When the client deletes the mail label
    Then the delete label operation shall complete without error

  # EARS: Event-driven
  Scenario: WHEN retrieving subscribed mailing lists, the client shall return the data
    Given an authenticated character subscribed to mailing lists
    When the client requests their mailing lists
    Then the client shall return the mailing list details

  # EARS: Event-driven
  Scenario: WHEN sending a new mail, the client shall deliver the message
    Given an authenticated character for sending mail
    When the client sends a mail to another character
    Then the client shall return the new mail ID

  # EARS: Event-driven
  Scenario: WHEN deleting a mail, the client shall complete the operation
    Given an authenticated character with a mail to delete
    When the client deletes the mail
    Then the delete mail operation shall complete without error

  # EARS: Event-driven
  Scenario: WHEN updating mail metadata to mark as read, the client shall apply the changes
    Given an unread mail
    When the client updates its metadata to mark it as read
    Then the update metadata operation shall complete without error

  # EARS: Event-driven
  Scenario: WHEN fetching headers, labels, and mailing lists simultaneously, the client shall return the data
    Given an authenticated character for concurrent mail fetch
    When the client fetches headers, labels, and lists concurrently
    Then all three mail requests shall resolve successfully

  # EARS: Unwanted
  Scenario: IF unauthorized access to mail, THEN the client shall return a forbidden error
    Given an unauthenticated mail request
    When the client requests mail headers without auth
    Then the client shall return a 403 forbidden error for mail

  # EARS: Unwanted
  Scenario: IF not found error for non-existent mail, THEN the client shall return a not-found error
    Given a mail ID that does not exist
    When the client requests the non-existent mail
    Then the client shall return a 404 not found error for mail
