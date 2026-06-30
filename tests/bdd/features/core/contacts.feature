Feature: Contact Management

  Scenario: Get contacts for a valid character
    Given a character with contacts
    When I request character contacts
    Then I should receive a list of contacts with standings

  Scenario: Handle empty contacts list
    Given a character with no contacts
    When I request character contacts for the empty list
    Then I should receive an empty array

  Scenario: Handle unauthorized access to contacts
    Given an invalid or expired token for contacts
    When I request character contacts without authorization
    Then I should receive a 403 forbidden error

  Scenario: Get contact labels for a character
    Given a character with custom labels
    When I request contact labels
    Then I should receive the label definitions

  Scenario: Add new contacts to a character contact list
    Given contact data with standings
    When I add contacts
    Then I should receive the IDs of the added contacts

  Scenario: Remove contacts from a character contact list
    Given existing contact IDs
    When I delete those contacts
    Then the deletion should complete successfully

  Scenario: Get contacts for a corporation
    Given a valid corporation ID for contacts
    When I request corporation contacts
    Then I should receive the corporation contact list

  Scenario: Get corporation contact labels
    Given a corporation with custom labels
    When I request corporation contact labels
    Then I should receive the corporation label definitions

  Scenario: Complete contact management workflow - list, add, and verify
    Given a character managing contacts
    When I list contacts then add new ones and verify
    Then the full workflow should succeed
