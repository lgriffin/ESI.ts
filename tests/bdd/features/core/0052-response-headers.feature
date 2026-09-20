Feature: ESI Response Header Best Practices
  ESI carries operational signal in response headers rather than in the body:
  route deprecation and upgrade notices arrive as RFC 7234 Warning headers, and
  every response is stamped with a request identifier CCP support asks for when
  investigating a fault. Callers that opt in with withMetadata receive those
  headers alongside the parsed body instead of losing them at the transport
  seam.

  These scenarios drive the real fetch layer through jest-fetch-mock, so header
  parsing, warning-code extraction and metadata assembly all execute.

  # ── Warning headers ─────────────────────────────────────────────────

  Rule: When a response carries a Warning header, the metadata-wrapped client shall expose its numeric code and its quoted text as meta.warning.
    ESI uses 299 for a deprecated route and 199 for a route with a newer
    version available. Splitting the header into a code and a message lets a
    caller branch on the code and log the text, rather than pattern-matching
    the raw header itself. Both codes are parsed by the same path, which is why
    the two scenarios below share this requirement.

    Scenario: Deprecation notice arrives as warning code 299
      Given a deprecated endpoint that returns a 299 warning header
      When the client calls it with metadata
      Then the meta shall contain the deprecation warning with code 299

    Scenario: Upgrade notice arrives as warning code 199
      Given an endpoint that returns a 199 upgrade warning header
      When the client calls it with metadata
      Then the meta shall contain the upgrade warning with code 199

  Rule: If a response carries no Warning header, then the metadata-wrapped client shall leave meta.warning undefined.
    The absence of a warning is the normal case, and it has to be
    distinguishable from a warning that failed to parse. An undefined value
    lets a caller test for a notice with a plain truthiness check.

    Scenario: Response without a Warning header leaves meta.warning undefined
      Given a normal endpoint with no warning header
      When the client calls it with metadata
      Then the meta shall not contain a warning

  # ── Provenance headers ──────────────────────────────────────────────

  Rule: When a response carries the x-esi-request-id header, the metadata-wrapped client shall expose its value as meta.requestId.
    The request identifier is what CCP support correlates against their own
    logs, so it has to survive as far as the caller's log line. It is exposed
    on successful responses here and on EsiError for failures.

    Scenario: Request identifier header is exposed as meta.requestId
      Given an API response with x-esi-request-id header
      When the client calls it with metadata
      Then the meta shall contain the request ID

  Rule: When a response carries the Date header, the metadata-wrapped client shall expose its value as meta.date.
    The server clock is the reference point for reasoning about cache age and
    about the expiry times ESI returns, both of which are meaningless against a
    local clock that has drifted.

    Scenario: Date header is exposed as meta.date
      Given an API response with a Date header
      When the client calls it with metadata
      Then the meta shall contain the date

  Rule: When a response carries the Content-Language header, the metadata-wrapped client shall expose its value as meta.contentLanguage.
    ESI honours a language preference but is free to serve a different
    localisation than the one asked for, so the caller needs the language it
    actually received before caching or displaying the text.

    Scenario: Content-Language header is exposed as meta.contentLanguage
      Given an API response with a Content-Language header
      When the client calls it with metadata
      Then the meta shall contain the language

  # ── Failure responses ───────────────────────────────────────────────

  Rule: The EsiError shall expose the status code, request URL, and request identifier supplied at construction.
    A failure is where provenance matters most, and an exception that carries
    only a message forces the caller to reconstruct the context by hand. These
    three fields are what a bug report to CCP needs.

    Scenario: EsiError retains the request ID, status code, and URL given at construction
      Given an EsiError created with a request ID
      Then the EsiError shall contain the request ID and status code and url
