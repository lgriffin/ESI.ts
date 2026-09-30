Feature: Path parameter validation
  Every ID a caller passes to an endpoint becomes a segment of the request
  path. A value that is empty, that holds a character with meaning in a URL,
  or that is a dot segment would change which route the request reaches:
  `characters/../assets/` resolves to `/assets/`, and `1/wallet` adds a
  segment the caller never asked for. The client checks each path parameter
  before it builds the URL, so a malformed ID fails at the call with a
  VALIDATION_ERROR and never reaches ESI.

  These scenarios call a real client method and read what reached the
  transport seam.

  Rule: If a path parameter's string form is empty, then the client shall reject the call with a VALIDATION_ERROR and send no request.
    An empty ID would leave an empty path segment, and ESI would answer a
    different route.

    Scenario: An empty character ID is refused before the request
      When the client requests the public information of the character ""
      Then the call shall be rejected with a VALIDATION_ERROR saying "must not be empty"
      And no request shall have been sent

  Rule: If a path parameter holds a character that has meaning in a URL, then the client shall reject the call with a VALIDATION_ERROR and send no request.
    A slash adds a path segment, and a question mark or hash ends the path,
    so the request would reach a route the caller did not name.

    Scenario: A character ID holding a slash is refused before the request
      When the client requests the public information of the character "2112625428/wallet"
      Then the call shall be rejected with a VALIDATION_ERROR saying "contains invalid characters"
      And no request shall have been sent

    Scenario: A character ID holding a question mark is refused before the request
      When the client requests the public information of the character "2112625428?datasource=x"
      Then the call shall be rejected with a VALIDATION_ERROR saying "contains invalid characters"
      And no request shall have been sent

  Rule: If a path parameter is a dot segment, then the client shall reject the call with a VALIDATION_ERROR and send no request.
    `.` and `..` survive URL encoding and are collapsed when the URL is
    resolved, so they would climb out of the route.

    Scenario: A dot-dot character ID is refused before the request
      When the client requests the public information of the character ".."
      Then the call shall be rejected with a VALIDATION_ERROR saying "must not be a dot segment"
      And no request shall have been sent

    Scenario: A single-dot character ID is refused before the request
      When the client requests the public information of the character "."
      Then the call shall be rejected with a VALIDATION_ERROR saying "must not be a dot segment"
      And no request shall have been sent

  Rule: If a numeric path parameter is not a finite number, then the client shall reject the call with a VALIDATION_ERROR and send no request.
    NaN and Infinity stringify to words ESI reads as a malformed ID.

    Scenario: A NaN character ID is refused before the request
      When the client requests the public information of a character whose ID is NaN
      Then the call shall be rejected with a VALIDATION_ERROR saying "must be a finite number"
      And no request shall have been sent

    Scenario: An infinite character ID is refused before the request
      When the client requests the public information of a character whose ID is Infinity
      Then the call shall be rejected with a VALIDATION_ERROR saying "must be a finite number"
      And no request shall have been sent
