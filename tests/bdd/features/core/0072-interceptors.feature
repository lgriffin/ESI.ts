@ARCH-08
Feature: Request and response interceptors
  `EsiClient.addRequestInterceptor` and `addResponseInterceptor` let an
  application change every request before it reaches the wire and every
  answer before the caller reads it: a tracing header, a body rewritten for a
  test, an auth middleware. Each returns a remover. The client runs the
  interceptors in the order they were added, each on the context the one
  before returned.

  These scenarios add the interceptors to a client over the mock transport and
  read what went over the wire and what the call returned.

  # ── Request interceptors

  Rule: When request interceptors are added, the client shall run them in the order they were added, each on the request the one before returned.
    An interceptor that reads a header another one set, such as a signer that
    signs the tracing header, depends on running after it.

    Scenario: The second interceptor reads the header the first one set
      Given the client has a request interceptor "trace" that sets the header "X-Trace" to "fleet"
      And the client has a request interceptor "suffix" that appends "-op" to the header "X-Trace"
      And ESI reports the server status
      When the client requests the server status
      Then the request shall carry the header "X-Trace" with the value "fleet-op"

  Rule: When a request interceptor's remover is called, the client shall stop running that interceptor and keep running the others.
    An application removes a tracing interceptor when tracing is switched off;
    the auth middleware added beside it must keep working.

    Scenario: The removed interceptor's header is gone and the other one's stays
      Given the client has a request interceptor "trace" that sets the header "X-Trace" to "fleet"
      And the client has a request interceptor "tenant" that sets the header "X-Tenant" to "corp"
      And the interceptor "trace" is removed
      And ESI reports the server status
      When the client requests the server status
      Then the request shall not carry the header "X-Trace"
      And the request shall carry the header "X-Tenant" with the value "corp"

  # ── Response interceptors

  Rule: When a client has a response interceptor and no request interceptor, the client shall return the answer the response interceptor returned.
    The pipeline skips the middleware when a client has no interceptors at
    all; a client with response interceptors only must still run them.

    Scenario: A response interceptor rewrites the player count
      Given the client has a response interceptor "zero" that sets the field "players" to 0
      And ESI reports the server status
      When the client requests the server status
      Then the result's field "players" shall be 0

  Rule: When a response interceptor's remover is called, the client shall stop running that interceptor and keep running the others.
    Removing one rewrite must not undo another an application still relies
    on.

    Scenario: The removed interceptor's rewrite is gone and the other one's stays
      Given the client has a response interceptor "zero" that sets the field "players" to 0
      And the client has a response interceptor "version" that sets the field "server_version" to "test"
      And the interceptor "zero" is removed
      And ESI reports the server status
      When the client requests the server status
      Then the result's field "players" shall be 23456
      And the result's field "server_version" shall be "test"

  # ── Interceptors on a public custom client

  @TEST-11
  Rule: When a request interceptor on a public custom client adds a header other than Authorization, the public custom client shall send that header.
    The public client withholds only the bearer an interceptor adds
    (0064-public-custom-client.feature); a tracing header must still reach
    the server.

    Scenario: A tracing header added by an interceptor reaches the server
      Given a public custom client built with the "status" client and a request interceptor that sets the header "X-Trace" to "fleet"
      And ESI reports the server status
      When the public custom client requests the server status
      Then the request shall carry the header "X-Trace" with the value "fleet"
