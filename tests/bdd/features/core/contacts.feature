Feature: Contact Management

  # EARS: Event-driven
  Scenario: WHEN getting contacts for a valid character, the client shall return the data
    Given a character with contacts
    When the client requests character contacts
    Then the client shall return a list of contacts with standings

  # EARS: State-driven
  Scenario: WHILE empty contacts list, the client shall return an empty result
    Given a character with no contacts
    When the client requests character contacts for the empty list
    Then the client shall return an empty array

  # EARS: Unwanted
  Scenario: IF unauthorized access to contacts, THEN the client shall return a forbidden error
    Given an invalid or expired token for contacts
    When the client requests character contacts without authorization
    Then the client shall return a 403 forbidden error

  # EARS: Event-driven
  Scenario: WHEN getting contact labels for a character, the client shall return the data
    Given a character with custom labels
    When the client requests contact labels
    Then the client shall return the label definitions

  # EARS: Event-driven
  Scenario: WHEN adding new contacts to a character contact list, the client shall add the entries
    Given contact data with standings
    When the client adds contacts
    Then the client shall return the IDs of the added contacts

  # EARS: Event-driven
  Scenario: WHEN removing contacts from a character contact list, the client shall complete the operation
    Given existing contact IDs
    When the client deletes those contacts
    Then the deletion shall complete successfully

  # EARS: Event-driven
  Scenario: WHEN getting contacts for a corporation, the client shall return the data
    Given a valid corporation ID for contacts
    When the client requests corporation contacts
    Then the client shall return the corporation contact list

  # EARS: Event-driven
  Scenario: WHEN getting corporation contact labels, the client shall return the data
    Given a corporation with custom labels
    When the client requests corporation contact labels
    Then the client shall return the corporation label definitions

  # EARS: Event-driven
  Scenario: WHEN completing contact management workflow - list, add, and verify, the client shall complete all steps
    Given a character managing contacts
    When the client lists contacts then add new ones and verify
    Then the full workflow shall succeed
