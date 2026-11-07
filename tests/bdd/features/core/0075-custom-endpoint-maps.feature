@ARCH-14
Feature: Endpoint maps: request validation, cursor routes and safe mode
  A domain client turns an endpoint map into methods. The map decides what a
  method checks before sending, how it pages and how it answers in safe mode.
  An application extends the library the same way, with a BaseEsiClient over
  an endpoint map of its own, so these Rules hold the map's options to what
  they promise whichever client defines them.

  The cursor scenarios use such an application client, whose one method lists
  a corporation's projects through a route marked cursorPagination; no
  shipped endpoint map uses that option today.

  # ── Request validation

  Rule: Where validateRequest is on, if a request body fails the endpoint's request schema, then the EsiClient shall reject the call with a request EsiValidationError without sending it.
    A body ESI would refuse costs a request and an error-limit point; the
    schema catches it before the wire.

    Scenario: A mail with an empty subject is refused before it is sent
      Given a client that validates requests
      When the client sends a mail with the subject ""
      Then the call shall be rejected with a request EsiValidationError
      And the client shall have sent 0 requests

  Rule: Where validateRequest is on, when a request body passes the endpoint's request schema, the EsiClient shall send it.
    Validation stops bad bodies only.

    Scenario: A mail with a subject is sent
      Given a client that validates requests
      And ESI accepts the mail as mail 13
      When the client sends a mail with the subject "Fleet at 19:00"
      Then the call shall resolve with 13
      And the client shall have sent 1 request

  # ── Cursor routes on an application's own client

  Rule: When a cursor-paginated method is called with a cursor token, the client shall send the token as the query parameter of the same name.
    The token is the only thing that tells ESI which page to answer.

    Scenario Outline: The projects are listed <direction> the token "<token>"
      Given ESI lists the corporation projects "a" and "b" with the cursors "prev" and "next"
      When the application client lists the corporation projects <direction> the token "<token>"
      Then the request to ESI shall carry the query parameter "<direction>" with the value "<token>"

      Examples:
        | direction | token    |
        | after     | cursor-1 |
        | before    | cursor-0 |

  Rule: When a cursor-paginated method is called with an empty cursor token, the client shall send the request without a query string.
    An empty token asks for the first page.

    Scenario: The projects are listed with an empty after token
      Given ESI lists the corporation projects "a" and "b" with the cursors "prev" and "next"
      When the application client lists the corporation projects with an empty after token
      Then the request to ESI shall carry no query string

  Rule: When a cursor page answers a list, the client shall resolve with the list as the page's data and the before and after cursors from the response headers.
    The caller pages on with the after cursor, so it must come back with the
    items.

    Scenario: A page of two projects carries both cursors
      Given ESI lists the corporation projects "a" and "b" with the cursors "prev" and "next"
      When the application client lists the corporation projects after the token "cursor-1"
      Then the page shall hold the projects "a, b" with the cursors "prev" and "next"

  Rule: Where response validation is off, when a cursor page answers one object or JSON null, the client shall resolve with that object as the only item or with no items, and with null cursors when ESI sent none.
    A cursor page is a list for the caller, whatever the body's shape.

    Scenario: A page that is one project is a list of one
      Given a client that does not validate responses
      And ESI answers the corporation projects with the single project "solo"
      When the application client lists the corporation projects after the token "cursor-1"
      Then the page shall hold the projects "solo" with no cursors

    Scenario: A page of null is an empty list
      Given a client that does not validate responses
      And ESI answers the corporation projects with JSON null
      When the application client lists the corporation projects after the token "cursor-1"
      Then the page shall hold no projects and no cursors

  Rule: If a cursor page fails the endpoint's response schema, then the client shall reject with an EsiValidationError.
    A cursor route validates its answer as every other route does.

    Scenario: A project whose id is a number is refused
      Given ESI answers the corporation projects with a project whose id is a number
      When the application client lists the corporation projects after the token "cursor-1"
      Then the call shall be rejected with an EsiValidationError naming "corporations/98000001/projects"

  Rule: When a cursor-paginated method is called through withMetadata or withSafeMode, the client shall resolve with the page together with the response metadata, inside a successful result in safe mode.
    The views wrap a cursor page the way they wrap any other answer.

    Scenario Outline: The projects listed through the <view> view carry their metadata
      Given ESI lists the corporation projects "a" and "b" with the cursors "prev" and "next"
      When the application client lists the corporation projects through the <view> view
      Then the <view> result shall hold the projects "a, b" and the response metadata

      Examples:
        | view     |
        | metadata |
        | safe     |

  # ── Safe mode

  Rule: When a call through a domain client's withSafeMode view succeeds, the client shall resolve with a result whose ok is true, holding the data and the response metadata.
    Safe mode never throws, so ok is how the caller tells success from
    failure.

    Scenario: The server status read in safe mode is a successful result
      Given ESI reports the server status
      When the status client reads the server status through its safe mode view
      Then the result shall be ok with the server status and the response metadata

  # ── fetchAllCursorPages

  Rule: When fetchAllCursorPages walks a body-cursor listing, the helper shall request each next page with the after token of the page before until a page comes back empty.
    ESI's freelance job listing carries its cursor in the body. The helper
    follows it for the caller and stops at the first empty page, whatever
    cursor that page still carries.

    Scenario: Three pages of freelance jobs, the last empty, give the jobs of the first two
      Given a client that does not validate responses
      And ESI lists the freelance jobs "job-1", "job-2" and then no jobs, each page with an after token
      When fetchAllCursorPages walks the freelance jobs
      Then the walk shall resolve with the freelance jobs "job-1, job-2"
      And the first request to ESI shall carry no query string
      And the requests to ESI shall have carried the after tokens "-, page-2, page-3"

  Rule: When a page of a body-cursor listing has no after token, fetchAllCursorPages shall stop with the items fetched.
    A page without an after token is the last page.

    Scenario: One page of freelance jobs without an after token is the whole listing
      Given a client that does not validate responses
      And ESI lists the freelance job "job-1" with no after token
      When fetchAllCursorPages walks the freelance jobs
      Then the walk shall resolve with the freelance jobs "job-1"
      And the client shall have sent 1 request

  # ── Deprecation wording

  Rule: When an endpoint is deprecated with only a message, the CustomEsiClient shall log the warning without a replacement or a sunset date.
    A warning that names a replacement of undefined misleads the reader.

    Scenario: A deprecation with only a message warns with only the message
      Given the server status endpoint is marked deprecated with only the message "Read the route status instead."
      And ESI reports the server status
      When a custom client built with the "status" client and a recording logger requests the server status
      Then the custom client's logger shall receive the warning "Endpoint 'getStatus' is deprecated. Read the route status instead."
