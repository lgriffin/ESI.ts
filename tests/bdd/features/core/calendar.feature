Feature: Calendar Management

  Scenario: Get upcoming events for a character
    Given a character with upcoming events
    When I request calendar events
    Then I should receive a list of events

  Scenario: Handle empty calendar
    Given a character with no upcoming events
    When I request calendar events for the empty calendar
    Then I should receive an empty array

  Scenario: Handle unauthorized access to calendar
    Given an invalid or expired token for calendar
    When I request calendar events without authorization
    Then I should receive a 403 forbidden error

  Scenario: Get detailed information for a specific event
    Given a valid event ID
    When I request event details
    Then I should receive complete event information

  Scenario: Handle non-existent event
    Given an invalid event ID
    When I request event details for the invalid event
    Then I should receive a 404 not found error

  Scenario: Accept a calendar event invitation
    Given a pending event invitation to accept
    When I accept the event
    Then the acceptance response should be recorded successfully

  Scenario: Decline a calendar event invitation
    Given a pending event invitation to decline
    When I decline the event
    Then the decline response should be recorded

  Scenario: Get attendee list for an event
    Given an event with attendees
    When I request the attendee list
    Then I should receive attendees with their response statuses

  Scenario: Complete event lifecycle - view, respond, and check attendees
    Given an upcoming event for lifecycle test
    When I view details then respond and check attendees
    Then I should complete the full event interaction
