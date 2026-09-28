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

  # ── Headers the client does not honour ─────────────────────────────

  Rule: If a response body is valid JSON under a Content-Type other than application/json, then the EsiClient shall not reject the response.
    The body decides, not the label on it. ESI's edge has served JSON under
    text/plain, and a body that is not JSON is refused as a parse error
    whatever its Content-Type says (ERRORS.md, EsiFaultError), so trusting the
    header would only add a way to fail a good response.

    Scenario: A server status served as text/plain resolves with its fields
      Given an API response whose JSON body is labelled text/plain
      When the client calls it with metadata
      Then the meta shall carry the server status from the body

  Rule: If a page after the first carries an X-Pages count that differs from page 1's, then the EsiClient shall not change the number of pages it requests.
    Page 1's X-Pages is authoritative (PAGINATION.md). A count that grows
    while the pages are walked describes a different snapshot of the
    resource, so following it would stitch two snapshots together. A count
    that shrinks ends at the first empty page instead.

    Scenario: Page 2 announcing a third page is the last page requested
      Given ESI answers the market types with page 1 announcing 2 pages and page 2 announcing 3
      When the client requests the market types for The Forge
      Then the client resolves with the market types of pages 1 and 2
      And the client requested 2 pages

  Rule: If page 1 announces more than 1000 pages, then the EsiClient shall not request a page past page 1000.
    The cap bounds how long one call can run and how much of the error
    budget a misreported X-Pages can spend. No ESI resource comes near it.
    The cap belongs to the eager call; the stream and fetch-all helpers
    follow X-Pages without it.

    Scenario: X-Pages of 1001 is walked as far as page 1000
      Given ESI answers the market types with page 1 announcing 1001 pages and a type on every page
      When the client requests the market types for The Forge
      Then the client resolves with 1000 market types
      And the client requested 1000 pages

  # ── Failure responses ───────────────────────────────────────────────

  Rule: The EsiError shall expose the status code, request URL, and request identifier supplied at construction.
    A failure is where provenance matters most, and an exception that carries
    only a message forces the caller to reconstruct the context by hand. These
    three fields are what a bug report to CCP needs.

    Scenario: EsiError retains the request ID, status code, and URL given at construction
      Given an EsiError created with a request ID
      Then the EsiError shall contain the request ID and status code and url
