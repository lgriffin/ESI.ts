Feature: A mock transport for an application's own tests
  An application that uses the SDK needs its own tests to run without ESI.
  Until now it replaced `globalThis.fetch` by hand and rebuilt, in every
  project, the same routing table and the same record of what went over the
  wire. `createMockTransport()` in the `./testing` entry is an `HttpTransport`:
  it is passed to `createEsi({ transport })`, answers the requests the
  application's code sends from a table of routes, and keeps every request it
  saw so a test can assert on the method, the URL, the headers and the body.

  A route names a method and a path. The path is the ESI path template as the
  spec writes it, so `{character_id}` stands for one path segment, or a
  regular expression tested against the whole URL. Routes are tried in the
  order they were added and the first match answers. Everything between the
  application's call and the transport is the SDK's real pipeline: URL
  building, headers, retries, the cache, pagination and response validation
  all execute, so a test written against the mock can fail for a bug in the
  SDK as well as in the application.

  These scenarios drive the generated operations through a runtime built over
  the mock transport, and read the transport's own record of the exchange.

  # ── Answering

  Rule: When a request matches a route, the mock transport shall answer it with the route's status, headers and body.
    The route describes what ESI would send back; the pipeline treats the
    answer as it would a real one. An object or array body is JSON-encoded
    with `content-type: application/json`; a string body is sent verbatim.
    The status defaults to 200 and headers are optional.

    Scenario: A wallet balance routed by path template reaches a character's view
      Given a runtime over a mock transport
      And the mock transport answers "GET" "/characters/{character_id}/wallet" with the wallet balance
      And a view for a character holding an access token
      When the character's view requests the wallet balance
      Then the view shall receive the wallet balance

    Scenario: A routed 404 is raised as the not-found error ESI would cause
      Given a runtime over a mock transport
      And the mock transport answers "GET" "/characters/{character_id}/wallet" with status 404
      And a view for a character holding an access token
      When the character's view requests the wallet balance
      Then the call shall be rejected with status 404

    Scenario: A route's X-Pages header drives pagination
      Given a runtime over a mock transport
      And the mock transport answers "GET" "/characters/{character_id}/assets" with one asset on each of two pages
      And a view for a character holding an access token
      When the character's view follows every page of the character's assets
      Then the view shall receive two assets

  Rule: If a request matches no route, then the mock transport shall answer it with status 501 and an error body naming the request's method and URL.
    A silent default, an empty 200 or an invented body, would let a test pass
    without exercising anything. A rejected promise would be wrapped by the
    pipeline as a network failure and retried with the application's backoff,
    so an unrouted request would fail slowly and under the wrong name. A 501 is
    not retried, reaches the application as an `EsiError` whose message names
    the request, and the transport lists it under `unrouted` for a test that
    checks the whole exchange.

    Scenario: An unrouted wallet request fails naming the request it could not answer
      Given a runtime over a mock transport
      And a view for a character holding an access token
      When the character's view requests the wallet balance
      Then the call shall be rejected with status 501
      And the rejection shall name the unanswered request "GET https://esi.evetech.net/characters/2114794365/wallet"
      And the mock transport shall list the request "GET https://esi.evetech.net/characters/2114794365/wallet" as unrouted

  # ── Recording

  Rule: The mock transport shall record every request's method, URL, headers and body in the order they were sent.
    What went over the wire is the evidence a test of the application has:
    which token a view sent, which IDs a lookup posted. Header names are
    recorded in lower case, as the Fetch API normalises them, and a request
    with no body records `undefined`.

    Scenario: The bearer token a character's view sent is readable from the record
      Given a runtime over a mock transport
      And the mock transport answers "GET" "/characters/{character_id}/wallet" with the wallet balance
      And a view for a character holding an access token
      When the character's view requests the wallet balance
      Then the mock transport shall have recorded one request carrying the header "authorization" with the value "Bearer raw-access-token"

    Scenario: A POST body is recorded as it was sent
      Given a runtime over a mock transport
      And the mock transport answers "POST" "/universe/names" with the names of the IDs
      When the public view resolves the names of two IDs
      Then the recorded request shall carry the body "[1,2]"

  # ── The route table

  Rule: When a route has answered the number of requests its times allows, the mock transport shall retire it.
    A route with `times` answers that many matching requests and then no more,
    so a test can script a sequence: one answer for the first call, another
    for the second, or a single answer after which anything further is
    unrouted. A route without `times` answers every matching request.

    Scenario: A once-only route answers the first character and not the second
      Given a runtime over a mock transport
      And the mock transport answers "GET" "/characters/{character_id}/wallet" with the wallet balance once
      And views for two characters of one corporation
      When each character's view requests its own wallet balance
      Then the first view shall receive the wallet balance
      And the second call shall be rejected with status 501

  Rule: When it is reset, the mock transport shall forget its routes and its recorded requests.
    One transport can serve a whole test file: `reset()` between tests leaves
    nothing of the previous exchange behind, without rebuilding the runtime.

    Scenario: A reset transport has no routes and no record
      Given a runtime over a mock transport
      And the mock transport answers "GET" "/characters/{character_id}/wallet" with the wallet balance
      And a view for a character holding an access token
      And the character's view has requested the wallet balance
      When the mock transport is reset
      Then the mock transport shall have no routes and no recorded requests
