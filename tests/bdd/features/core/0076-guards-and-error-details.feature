@ARCH-07
Feature: Input guards and what an error tells its reader
  Before a request leaves, the client checks the base URL it was given and
  every path and query value a caller passes. After a failure, the error it
  raises says what went wrong in its class, its methods and its message. These
  Rules cover the checks 0059-path-parameters.feature leaves out and the
  details an application reads off an error once 0066-error-classification
  has told it which kind it holds.

  # ── The base URL

  Rule: If the base URL does not use HTTPS, then the EsiClient shall refuse to be constructed with a VALIDATION_ERROR.
    A plain HTTP base URL would send the access token in clear text.

    Scenario: An http base URL is refused
      When an EsiClient is constructed with the base URL "http://esi.evetech.net"
      Then the construction shall fail with a VALIDATION_ERROR saying "must use HTTPS"

  Rule: If the base URL's host is not esi.evetech.net and unsafeAllowCustomHost is not set, then the EsiClient shall refuse to be constructed with a VALIDATION_ERROR.
    The token belongs to ESI; another host would receive it.

    Scenario: A base URL on another host is refused
      When an EsiClient is constructed with the base URL "https://esi.example.com"
      Then the construction shall fail with a VALIDATION_ERROR saying "is not in the allowlist"

  Rule: Where unsafeAllowCustomHost is set, the EsiClient shall accept an HTTPS base URL on another host.
    A proxy or a test server is the documented reason to set it.

    Scenario: A base URL on another host is accepted with unsafeAllowCustomHost
      When an EsiClient is constructed with the base URL "https://esi.example.com" and unsafeAllowCustomHost
      Then the construction shall succeed

  # ── Path and query values

  Rule: If a path parameter is null or undefined, then the client shall reject the call with a VALIDATION_ERROR and send no request.
    Without the check, the value would reach the path as the word null or
    undefined, and ESI would answer for a character that does not exist.

    Scenario Outline: A character ID that is <value> is refused before the request
      When the client requests the public information of a character ID that is <value>
      Then the call shall be rejected with a VALIDATION_ERROR saying "must not be empty"
      And no request shall have been sent

      Examples:
        | value     |
        | null      |
        | undefined |

  Rule: If a query parameter is null, is a number that is not finite, or is longer than 2000 characters, then the client shall reject the call with a VALIDATION_ERROR and send no request.
    Each would reach ESI as a value it cannot read, and a very long one would
    pass the URL length limits of the servers in between.

    Scenario Outline: A market history request whose type ID is <value> is refused
      When the client requests the market history of The Forge for the type ID <value>
      Then the call shall be rejected with a query VALIDATION_ERROR saying "<reason>"
      And no request shall have been sent

      Examples:
        | value    | reason                       |
        | null     | must not be null or undefined |
        | Infinity | must be a finite number      |

    Scenario: A market history request whose type ID is 2001 characters long is refused
      When the client requests the market history of The Forge for a type ID of 2001 characters
      Then the call shall be rejected with a query VALIDATION_ERROR saying "exceeds maximum length"
      And no request shall have been sent

  Rule: When a query parameter is exactly 2000 characters long, the client shall send it.
    The limit is the longest value allowed, not the shortest refused.

    Scenario: A market history request whose type ID is 2000 characters long is sent
      Given ESI answers any market history request with no history
      When the client requests the market history of The Forge for a type ID of 2000 characters
      Then the call shall resolve with no history

  # ── Retry delays

  Rule: When the client retries a request, the client shall wait the base delay doubled for each earlier retry, varied by up to a quarter either way and capped at the maximum delay.
    Doubling backs off from a struggling server, the variation keeps many
    clients from retrying in step, and the cap bounds how long a call waits.

    Scenario: Two retries with a 100 ms base and a 150 ms cap wait about 100 ms and then 150 ms
      Given a client with a supplied clock, 2 retries, a 100 ms base delay and a 150 ms cap
      And ESI answers the server status with HTTP 503 twice and then reports it
      When the client requests the server status
      Then the client shall have waited between 75 and 125 ms and then 150 ms

  # ── Response warnings

  Rule: When a response carries a Warning header of a three-digit code, a space, a hyphen, a space and a text, quoted or not, the client shall report the code and the text in the response metadata.
    ESI announces deprecations and upgrades in the Warning header, and does
    not always quote the text.

    Scenario Outline: The Warning <header> is reported as code <code>
      Given ESI reports the server status with the Warning header '<header>'
      When the client reads the server status with its metadata
      Then the response metadata shall carry the warning <code> with the text '<text>'

      Examples:
        | header                           | code | text                     |
        | 299 - "This route is deprecated" | 299  | This route is deprecated |
        | 199 - This route has moved       | 199  | This route has moved     |
        | 299 - "Route moved" for now      | 299  | "Route moved" for now    |

  Rule: If a Warning header does not have that form, then the client shall report no warning in the response metadata.
    A header ESI did not write in its own form is not a notice the client can
    read, so it reports none rather than a guess.

    Scenario Outline: The Warning <header> is not reported
      Given ESI reports the server status with the Warning header '<header>'
      When the client reads the server status with its metadata
      Then the response metadata shall carry no warning

      Examples:
        | header                      |
        | Note 299 - "Route moved"    |
        | x199 - This route has moved |
        | 9 - This route has moved    |

  # ── Error details

  Rule: When an application asks an error whether it is a timeout, the error shall answer true only for a timeout.
    isTimeout is the method on every error, beside the isTimeout guard, for
    an application that already holds an EsiError.

    Scenario Outline: A <kind> answers <answer> when asked whether it is a timeout
      When an application asks a "<kind>" whether it is a timeout
      Then the answer shall be <answer>

      Examples:
        | kind                  | answer |
        | status 502            | false  |
        | TimeoutError          | true   |
        | CircuitOpenError      | false  |
        | EsiNetworkError       | false  |
        | EsiFaultError         | false  |
        | EsiConfigurationError | false  |
        | EsiValidationError    | false  |

  Rule: When an EsiValidationError is raised, its message shall name the request body or the response, whichever failed, and the URL without its sensitive query values.
    The message is what a log shows; it must say which side broke and must
    not carry a token passed in the query.

    Scenario Outline: A <direction> validation error for a URL with a token names the <name> without the token
      When an application raises a <direction> EsiValidationError for "https://esi.evetech.net/characters/1/mail/?token=secret-value"
      Then the error message shall start with "<name> validation failed for"
      And the error message shall end with "https://esi.evetech.net/characters/1/mail/?token=%5BREDACTED%5D"
      And the error message shall not contain "secret-value"

      Examples:
        | direction | name         |
        | request   | Request body |
        | response  | Response     |

  Rule: When an EsiPaginationError is raised, its endpoint shall keep the route and the query values that are not sensitive, and redact the sensitive ones.
    The endpoint is what an application logs and groups failures by, so it
    must name the route exactly without carrying a token.

    Scenario Outline: The endpoint <endpoint> is reported as <reported>
      When an application raises an EsiPaginationError for the endpoint "<endpoint>"
      Then the error's endpoint shall be "<reported>"

      Examples:
        | endpoint                                            | reported                                                |
        | markets/10000002/orders/?order_type=all&token=abc  | markets/10000002/orders/?order_type=all&token=[REDACTED] |
        | markets/10000002/orders/?order_type=all            | markets/10000002/orders/?order_type=all                 |
        | alliances/                                          | alliances/                                              |

  Rule: When an EsiPaginationError is raised without an underlying error, the EsiPaginationError's message shall describe why the walk stopped.
    A stop with no error behind it, such as an empty page, has only the
    reason to tell the reader. With no partial result given, it carries an
    empty one.

    Scenario Outline: A <reason> stop is described as "<text>"
      When an application raises an EsiPaginationError for reason "<reason>" after 2 of 3 pages without an underlying error
      Then the error message shall end with "<text>"
      And the error shall carry an empty partial result

      Examples:
        | reason       | text                                                          |
        | empty-page   | page 2 of 3 was empty, so the collection changed during the walk |
        | cursor-cap   | stopped at the 2-page limit with an after cursor still set    |
        | fetch-failed | stopped after 2 pages                                         |

    Scenario: A fetch-failed stop with no page count says 0 pages
      When an application raises an EsiPaginationError for reason "fetch-failed" with no page count and no underlying error
      Then the error message shall end with "stopped after 0 pages"

    Scenario: A stop with an underlying error carries that error's message
      When an application raises an EsiPaginationError for reason "empty-page" after 2 of 3 pages with the underlying error "page 3 timed out"
      Then the error message shall end with "page 3 timed out"
