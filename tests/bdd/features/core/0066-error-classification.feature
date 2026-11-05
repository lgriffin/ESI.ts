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

  Rule: If a value that is not an EsiError is classified, then every error type guard shall return false.
    An application's catch block also sees its own errors and those of other
    libraries. A guard is a type predicate, so it must answer false for them
    rather than read a status the value does not have.

    Scenario: An application's own Error is not classified as any ESI failure
      When an application classifies its own Error with every error type guard
      Then every error type guard shall return false
