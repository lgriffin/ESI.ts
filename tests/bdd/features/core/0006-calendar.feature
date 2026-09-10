Feature: Calendar Management
  The Calendar client covers the in-game event calendar: the list of a
  character's upcoming events, the detail record for one event, the attendee
  roll with each attendee's answer, and the call that submits the character's
  own answer. Everything here is token-scoped to a single character, and the
  response value is the one piece of state this domain writes rather than
  reads.

  # ── Reading the calendar ────────────────────────────────────────────

  Rule: When calendar events are requested for a character ID, the Calendar client shall return an array whose entries each carry event_id, title, event_date, event_response, and importance.
    The list view is what a calendar surface renders. The event_response on
    each entry is what marks an invitation as still needing an answer, and
    importance is what separates a routine event from one a corporation flags
    as mandatory.

    Scenario: Event list holding an accepted event and an unanswered event
      Given a character with upcoming events
      When the client requests calendar events
      Then the client shall return a list of events

  Rule: If a character has no upcoming events, then the Calendar client shall return an empty array.
    An empty calendar is an ordinary state, not an error. Returning an empty
    array rather than null keeps the call site free of a special case before
    iterating.

    Scenario: Character with an empty calendar
      Given a character with no upcoming events
      When the client requests calendar events for the empty calendar
      Then the client shall return an empty array

  Rule: When one event is requested by character ID and event ID, the Calendar client shall return a record carrying event_id, title, text, duration, owner_id, and owner_type.
    The detail record adds the event body and its duration over the list view,
    along with the owner that issued it. The owner_type distinguishes a
    corporation-issued event from an alliance or character one, which is what
    decides how a caller attributes it.

    Scenario: Detail record for a corporation-owned fleet operation
      Given a valid event ID
      When the client requests event details
      Then the client shall return complete event information

  Rule: When the attendee list is requested for an event, the Calendar client shall return an array whose entries each carry character_id and event_response.
    The attendee roll is how an event owner counts who is coming. Each answer
    is one of the response values, so the pair of who and what answer is the
    whole content of an entry.

    Scenario: Attendee list spanning accepted, tentative, and declined responses
      Given an event with attendees
      When the client requests the attendee list
      Then the client shall return attendees with their response statuses

  # ── Responding to invitations ───────────────────────────────────────

  Rule: When an invitation response is submitted, the Calendar client shall pass the character ID, the event ID, and the response value through to the response call unchanged.
    This is the one write in the domain, and it carries no response body — the
    only observable is what was sent. The two scenarios below cover the two
    answers a caller sends most, which travel the same path and differ only in
    the value forwarded.

    Scenario: Accepting an invitation
      Given a pending event invitation to accept
      When the client accepts the event
      Then the acceptance response shall be recorded successfully

    Scenario: Declining an invitation
      Given a pending event invitation to decline
      When the client declines the event
      Then the decline response shall be recorded

  Rule: When an event detail read is followed by a response submission and an attendee read, the Calendar client shall resolve every call in the sequence.
    This is the ordinary path through the domain: look at what was invited,
    answer it, then see who else is coming. The calls are ordered rather than
    concurrent because the attendee read is meant to observe the state after
    the answer.

    Scenario: Detail read, response, and attendee read for one event
      Given an upcoming event for lifecycle test
      When the client views details then respond and check attendees
      Then the client shall complete the full event interaction

  # ── Failure surface ─────────────────────────────────────────────────

  Rule: If a calendar request fails, then the Calendar client shall reject with an EsiError.
    One error type across the domain keeps the call site to a single catch.
    The two scenarios cover the distinct origins that reach this surface: an
    HTTP 403 where the token no longer carries the calendar scope, and an HTTP
    404 for an event that has been removed.

    Scenario: Expired token on the events endpoint rejects the request
      Given an invalid or expired token for calendar
      When the client requests calendar events without authorization
      Then the client shall return a 403 forbidden error

    Scenario: Unknown event ID rejects the request
      Given an invalid event ID
      When the client requests event details for the invalid event
      Then the client shall return a 404 not found error
