Feature: Per-client tenant and user agent
  ESI serves more than one tenant (Tranquility, the live server, and
  Singularity, the test server) and picks one per request from the X-Tenant
  header, defaulting to Tranquility when the header is absent. CCP also asks
  every caller to identify itself, so a misbehaving application can be
  contacted rather than blocked. Both belong to the client, not to a call: two
  clients in one process can talk to different tenants as different
  applications.

  These scenarios drive the real request pipeline to the transport seam and
  read the headers the request carried.

  Rule: Where a tenant is configured, the client shall send it as the X-Tenant header on every request.
    The tenant goes on public and authenticated routes alike, since ESI reads it
    before routing.

    Scenario: A client configured for Singularity names it on a public request
      Given a client configured for the "singularity" tenant
      And ESI reports the server status
      When the client requests the server status
      Then the request shall carry the header "X-Tenant" with the value "singularity"

    Scenario: The tenant also goes on an authenticated request
      Given a client configured for the "singularity" tenant
      And an authenticated character for wallet
      When the client requests their wallet balance
      Then the request shall carry the header "X-Tenant" with the value "singularity"

    Scenario: The tenant also goes on a YAML specification request
      Given a client configured for the "singularity" tenant
      And the ESI API is available for YAML
      When the client requests the OpenAPI YAML specification
      Then the request shall carry the header "X-Tenant" with the value "singularity"

  Rule: If no tenant is configured, then the client shall send no X-Tenant header.
    ESI's own default applies, so an existing client keeps talking to
    Tranquility without sending anything new.

    Scenario: A default client leaves the tenant to ESI
      Given a client with no tenant configured
      And ESI reports the server status
      When the client requests the server status
      Then the request shall not carry the header "X-Tenant"

  Rule: Where a user agent is configured, the client shall send it as the X-User-Agent header and at the start of the User-Agent header.
    The configured value replaces the client ID in X-User-Agent, which browsers
    send in place of the User-Agent they may not set. The library's own
    identifier stays at the end of User-Agent.

    Scenario: A named application identifies itself on both headers
      Given a client configured with the user agent "fleet-tool/2.1 (ops@example.com)"
      And ESI reports the server status
      When the client requests the server status
      Then the request shall carry the header "X-User-Agent" with the value "fleet-tool/2.1 (ops@example.com)"
      And the request's User-Agent header shall start with "fleet-tool/2.1 (ops@example.com) "

  Rule: If a configured tenant or user agent is not a legal HTTP header value, then the client constructor shall throw a VALIDATION_ERROR naming the option.
    fetch rejects a header value holding a control character on every request,
    so the client refuses the value once, where it was given.

    Scenario: A tenant holding a line break is refused at construction
      When a client is created with a tenant holding a line break
      Then the client constructor shall throw a VALIDATION_ERROR naming the option

    Scenario: A user agent holding a control character is refused at construction
      When a client is created with a user agent holding a NUL character
      Then the client constructor shall throw a VALIDATION_ERROR naming the option
