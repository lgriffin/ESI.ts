@ARCH-08
Feature: Public custom client built from chosen API clients
  `EsiClientBuilder.buildPublic()` builds the chosen domain clients as a
  public-only CustomEsiClient: its type leaves out every method that needs a
  token, so such a call does not compile. It is the custom-client counterpart
  of `createEsi()`'s `esi.public` (0056-shared-runtime.feature), for an
  application such as a price checker that must never put a character's token
  on the wire, whatever the environment or a shared builder configuration
  holds.

  These scenarios build the client through the real builder and drive it
  through the real request pipeline to the transport seam, then read what went
  over the wire.

  # ── No bearer leaves a public custom client

  @TEST-11
  Rule: If a configured request interceptor adds an Authorization header, then the public custom client shall not send an Authorization header.
    An interceptor configured for every client, such as an auth middleware an
    application installs once, would otherwise put a bearer back on a request
    the public client sends. The builder withholds the header after every
    interceptor has run.

    Scenario: A bearer added by a request interceptor is withheld from the server status request
      Given a public custom client built with the "status" client and a request interceptor that adds a bearer
      And ESI reports the server status
      When the public custom client requests the server status
      Then the request shall not carry the header "Authorization"

  @TEST-11
  Rule: If an access token is held by ESI_ACCESS_TOKEN or the builder, then the public custom client shall not send an Authorization header.
    `build()` falls back to ESI_ACCESS_TOKEN and takes the builder's token;
    `buildPublic()` ignores both, so a deployment that exports a token for
    another tool does not leak it through a public client.

    Scenario: A token in ESI_ACCESS_TOKEN is not sent
      Given ESI_ACCESS_TOKEN holds an access token
      And a public custom client built with the "status" client
      And ESI reports the server status
      When the public custom client requests the server status
      Then the request shall not carry the header "Authorization"

    Scenario: A token given to the builder is not sent
      Given a public custom client built with the "status" client from a builder holding an access token
      And ESI reports the server status
      When the public custom client requests the server status
      Then the request shall not carry the header "Authorization"

  # ── A method that needs a token

  Rule: If an authenticated method is invoked on a public custom client, then the public custom client shall reject the call with NO_AUTH_TOKEN without sending a request.
    The type forbids the call, so only a cast reaches it. The pipeline then
    finds no token to attach and refuses before the request leaves, rather
    than spending ESI's error budget on a certain 401.

    Scenario: A wallet request forced through a public custom client is refused before the wire
      Given ESI_ACCESS_TOKEN holds an access token
      And a public custom client built with the "wallet" client from a builder holding an access token
      When an authenticated wallet request is forced through the public custom client
      Then the call shall be rejected with NO_AUTH_TOKEN and no request shall be sent

    Scenario: A wallet request forced through a public custom client with a bearer interceptor is refused before the wire
      Given a public custom client built with the "wallet" client and a request interceptor that adds a bearer
      When an authenticated wallet request is forced through the public custom client
      Then the call shall be rejected with NO_AUTH_TOKEN and no request shall be sent
