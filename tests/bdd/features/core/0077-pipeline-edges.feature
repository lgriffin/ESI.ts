@ARCH-08
Feature: Request pipeline edges
  The request pipeline turns every call into one fetch and every answer into a
  result or an error. These Rules cover what it reports at its edges: a
  redirect it will not follow, the reason ESI gives for an error, the hint a
  401 or 403 carries, what counts towards the circuit breaker, what the
  middleware sees, and how the cache answers at the end of an entry's
  freshness and after a 304.

  # ── Redirects

  @TEST-11
  Rule: If ESI answers with a 3xx status other than 304, then the EsiClient shall reject the call with an EsiError carrying that status and naming only the redirect target's origin.
    The client never follows a redirect, because the token would go with it.
    The message names the origin and leaves out the target's path and query,
    which may carry a token of their own.

    Scenario Outline: A <status> redirect to another host is refused and named by its origin
      Given ESI answers the server status with a <status> redirect to "https://mirror.example/status/?token=abc"
      When the client tries to read the server status
      Then the call shall be rejected with an EsiError with status <status> whose message says "redirect to https://mirror.example,"
      And the error message shall not contain "token=abc"

      Examples:
        | status |
        | 300    |
        | 302    |
        | 307    |

    Scenario: A redirect whose Location cannot be parsed is refused as such
      Given ESI answers the server status with a 302 redirect to "https://["
      When the client tries to read the server status
      Then the call shall be rejected with an EsiError with status 302 whose message says "redirect to an unparsable location,"

    Scenario: A redirect without a Location is refused without a target
      Given ESI answers the server status with a 302 redirect and no Location
      When the client tries to read the server status
      Then the call shall be rejected with an EsiError with status 302 whose message says "redirect to a location the runtime did not disclose,"

  Rule: If ESI answers with HTTP 400, then the EsiClient shall reject the call with ESI's error rather than as a refused redirect.
    400 is the first status past the redirect range.

    Scenario: A 400 is ESI's error
      Given ESI answers the server status with HTTP 400 and the error "Invalid datasource"
      When the client tries to read the server status
      Then the call shall be rejected with an EsiError with status 400 whose message says "Invalid datasource"
      And the error message shall not contain "Redirect refused"

  # ── ESI's reason

  Rule: When ESI's error body gives a reason, the EsiClient shall add it to the error message trimmed and cut to 200 characters.
    The reason is the most useful line in a failure report; the cut keeps a
    runaway body out of the logs.

    Scenario: A reason padded with spaces is trimmed
      Given ESI answers the server status with HTTP 404 and the error "   Character not found   "
      When the client tries to read the server status
      Then the error message shall end with ": Character not found"

    Scenario: A reason of 300 characters is cut to 200
      Given ESI answers the server status with HTTP 404 and an error reason of 300 characters
      When the client tries to read the server status
      Then the error message shall end with a reason of 200 characters

  Rule: When ESI answers with HTTP 401 or 403, the EsiClient shall add to the error message what the caller can do about it.
    A 401 means the token is missing, expired or short of a scope; a 403
    means the SSO application lacks the scope. Each has a different fix.

    Scenario Outline: A <status> names its fix
      Given ESI answers the server status with HTTP <status> and the error "denied"
      When the client tries to read the server status
      Then the call shall be rejected with an EsiError with status <status> whose message says "<hint>"

      Examples:
        | status | hint                                           |
        | 401    | the access token was missing, expired          |
        | 403    | does not have the OAuth scopes required        |

  # ── What counts towards the circuit breaker

  Rule: Where the circuit breaker is enabled, when a request fails with HTTP 420, HTTP 429, a dropped connection or a timeout, the EsiClient shall count the failure towards opening that endpoint's circuit.
    Each says the endpoint, or the way to it, is unwell, even though no 5xx
    came back.

    Scenario Outline: One <failure> opens a circuit that opens after one failure
      Given a client whose circuit opens at a failure count of 1, with no retries and a 50 ms timeout
      And ESI answers the server status with <failure>
      When the client requests the server status twice
      Then the second call shall be rejected with a CircuitOpenError
      And the client shall have sent 1 request

      Examples:
        | failure             |
        | HTTP 420            |
        | HTTP 429            |
        | a dropped connection |
        | no answer in time   |

  Rule: Where the circuit breaker is enabled, when a request succeeds, the EsiClient shall reset that endpoint's count of consecutive failures.
    The threshold counts failures in a row; a success in between means the
    endpoint recovered.

    Scenario: A 503, a success and a 503 leave a circuit that opens after two failures closed
      Given a client whose circuit opens at a failure count of 2, with no retries and a 50 ms timeout
      And ESI answers the server status with HTTP 503, then reports it, then answers HTTP 503, then reports it
      When the client requests the server status 4 times
      Then the client shall have sent 4 requests

  Rule: Where the circuit breaker keys circuits by route template, the EsiClient shall share one circuit among every character's request to the same route.
    A template key protects a route that is down for everyone.

    Scenario: With template keys, a failed wallet for one character blocks the other's
      Given a client whose circuit opens at a failure count of 1 and keys circuits by template
      And ESI answers the wallet of character 2112625428 with HTTP 503
      When the client requests the wallets of characters 2112625428 and 90000001
      Then the second wallet call shall be rejected with a CircuitOpenError

  Rule: Where the circuit breaker keys circuits by resolved path, the EsiClient shall keep one circuit for each character's request to the same route.
    A path key keeps one character's failing wallet from blocking another's.

    Scenario: With resolved keys, a failed wallet for one character leaves the other's open
      Given a client whose circuit opens at a failure count of 1 and keys circuits by resolved
      And ESI answers the wallet of character 2112625428 with HTTP 503
      And ESI answers the wallet of character 90000001 with a balance
      When the client requests the wallets of characters 2112625428 and 90000001
      Then the second wallet call shall resolve with the balance

  # ── What the middleware sees

  Rule: When a request interceptor runs, the EsiClient shall hand it the headers the client built for the request.
    An interceptor that signs or audits a request reads those headers.

    Scenario: An interceptor sees the client's User-Agent
      Given the client has a request interceptor that records the headers it sees
      And ESI reports the server status
      When the client requests the server status
      Then the interceptor shall have seen a User-Agent header

  Rule: When a response interceptor runs, the EsiClient shall tell it how long the request took by the client's clock and whether the answer came from the cache.
    A timing interceptor reports latency; it must not count a cache hit as a
    fast request.

    Scenario: A response interceptor sees the duration and the cache flag
      Given a client with a supplied clock whose response interceptor records what it sees
      And ESI reports the server status
      When the client requests the server status
      Then the response interceptor shall have seen a duration of 0 ms and an answer not from the cache

  # ── The cache at the edges

  Rule: When a cached entry's age reaches its spec TTL, the EsiClient shall stop answering from that entry without a request.
    The TTL is the time ESI keeps the answer fresh; at that age ESI may
    already have a new one.

    Scenario: The server status at exactly its spec TTL is asked for again
      Given a client with a supplied clock
      And ESI reports the server status with an ETag twice
      When the client requests the server status, waits its spec TTL and requests it again
      Then the client shall have sent 2 requests

  Rule: When ESI answers a revalidation with HTTP 304, the EsiClient shall report the stored entry's ETag and headers in the response metadata, updated by the headers of the 304.
    The stored ETag names the body the client returns, even when the 304
    carries another.

    Scenario: A 304 with a new ETag reports the stored ETag and the stored headers
      Given a client with a supplied clock
      And ESI reports the server status with the ETag "v1" and the header "x-shard" set to "a"
      And ESI answers the next server status request with 304, the ETag "v2" and the request id "req-2"
      When the client reads the server status with its metadata, waits its spec TTL and reads it again
      Then the response metadata shall carry the ETag "v1", the header "x-shard" set to "a" and the request id "req-2"
