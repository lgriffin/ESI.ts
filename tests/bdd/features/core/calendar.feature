Feature: Calendar Management

  # EARS: Event-driven
  Scenario: WHEN getting upcoming events for a character, the client shall return the data
    Given a character with upcoming events
    When the client requests calendar events
    Then the client shall return a list of events

  # EARS: State-driven
  Scenario: WHILE empty calendar, the client shall return an empty result
    Given a character with no upcoming events
    When the client requests calendar events for the empty calendar
    Then the client shall return an empty array

  # EARS: Unwanted
  Scenario: IF unauthorized access to calendar, THEN the client shall return a forbidden error
    Given an invalid or expired token for calendar
    When the client requests calendar events without authorization
    Then the client shall return a 403 forbidden error

  # EARS: Event-driven
  Scenario: WHEN getting detailed information for a specific event, the client shall return the data
    Given a valid event ID
    When the client requests event details
    Then the client shall return complete event information

  # EARS: Unwanted
  Scenario: IF non-existent event, THEN the client shall return a not-found error
    Given an invalid event ID
    When the client requests event details for the invalid event
    Then the client shall return a 404 not found error

  # EARS: Event-driven
  Scenario: WHEN accepting a calendar event invitation, the client shall record the response
    Given a pending event invitation to accept
    When the client accepts the event
    Then the acceptance response shall be recorded successfully

  # EARS: Event-driven
  Scenario: WHEN declining a calendar event invitation, the client shall record the response
    Given a pending event invitation to decline
    When the client declines the event
    Then the decline response shall be recorded

  # EARS: Event-driven
  Scenario: WHEN getting attendee list for an event, the client shall return the data
    Given an event with attendees
    When the client requests the attendee list
    Then the client shall return attendees with their response statuses

  # EARS: Event-driven
  Scenario: WHEN completing event lifecycle - view, respond, and check attendees, the client shall complete all steps
    Given an upcoming event for lifecycle test
    When the client views details then respond and check attendees
    Then the client shall complete the full event interaction
