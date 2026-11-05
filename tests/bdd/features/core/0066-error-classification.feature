@ARCH-07
Feature: Classifying a rejected call
  Every failure the request pipeline raises is an EsiError carrying the HTTP
  status ESI answered with. An application branches on that status through
  the type guards exported from the root and from `./errors`: isNotFound to
  treat a missing record as absent, isRateLimited to back off, isRetryable to
  try again later, and so on. The guards are the supported way to read a
  rejection, so each must agree with the status it names and with no other.

  These scenarios send a request through the real pipeline over a mock
  transport that answers with an error status, then apply every guard to the
  rejection the application receives.

  Rule: When ESI answers a request with an HTTP error status, the error type guards shall classify the rejection by that status.
    A guard that answered true for the wrong status would send an
    application down the wrong branch: retrying a 403 forever, or treating a
    rate limit as a missing record. Each status here is one ESI sends, and
    the guards that apply are exactly the ones named. A 429 is left out:
    the rate limiter holds every retry for the Retry-After ESI sends, and
    0061-rate-limit-status.feature covers that path.

    Scenario Outline: A wallet balance answered with <status> is classified as <guards>
      Given a runtime over a mock transport
      And the mock transport answers "GET" "/characters/{character_id}/wallet" with status <status>
      And a view for a character holding an access token
      When the character's view requests the wallet balance
      Then the rejection shall satisfy exactly the error guards "<guards>"

      Examples:
        | status | guards                                   |
        | 400    | isEsiError                               |
        | 401    | isEsiError isUnauthorized                |
        | 403    | isEsiError isForbidden                   |
        | 404    | isEsiError isNotFound                    |
        | 500    | isEsiError isServerError                 |
        | 503    | isEsiError isServerError isRetryable     |

  Rule: When an application classifies an error the client raises, the error type guards shall answer true for exactly that error's kind, status and retry policy.
    Some failures never reach the wallet call above as a status: a rate
    limit the limiter turns into a wait, a timeout, an open circuit, a
    dropped connection, a body that fails its schema, or a fault in the
    client itself. Each still reaches the application as one of the
    exported error classes, and the guards are how it tells them apart. The
    retry policy is part of the answer: a timeout, a dropped connection and
    a 420, 429, 502 or 504 are worth trying again, while an open circuit, a
    validation failure and a client fault are not.

    Scenario Outline: A <kind> is classified as <guards>
      When an application classifies a "<kind>" with every error type guard
      Then exactly the error guards "<guards>" shall return true

      Examples:
        | kind                  | guards                                            |
        | status 420            | isEsiError isRateLimited isRetryable              |
        | status 429            | isEsiError isRateLimited isRetryable              |
        | status 502            | isEsiError isServerError isRetryable              |
        | status 504            | isEsiError isServerError isRetryable              |
        | TimeoutError          | isEsiError isTimeout isRetryable                  |
        | CircuitOpenError      | isEsiError isCircuitOpen                          |
        | EsiNetworkError       | isEsiError isRetryable isNetworkError             |
        | EsiValidationError    | isEsiError isValidationError                      |
        | EsiFaultError         | isEsiError isFaultError                           |
        | EsiConfigurationError | isEsiError isFaultError isConfigurationError      |
        | EsiParseError         | isEsiError isFaultError isParseError              |
        | EsiPaginationError    | isEsiError isFaultError isPaginationError         |
        | EsiTokenRefreshError  | isEsiError isFaultError isTokenRefreshError       |

  Rule: If a value that is not an EsiError is classified, then every error type guard shall return false.
    An application's catch block also sees its own errors and those of other
    libraries. A guard is a type predicate, so it must answer false for them
    rather than read a status the value does not have.

    Scenario: An application's own Error is not classified as any ESI failure
      When an application classifies its own Error with every error type guard
      Then every error type guard shall return false
