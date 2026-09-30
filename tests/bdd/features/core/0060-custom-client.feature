Feature: Custom client built from chosen API clients
  EsiClientBuilder builds a CustomEsiClient that carries only the API clients
  an application names, so a tool that reads the market and the server status
  does not construct the other thirty-odd clients. The built client shares one
  request pipeline between the clients it holds, configured the same way as
  EsiClient.

  These scenarios build a client through the builder and read what reached the
  transport seam.

  Rule: When a custom client is built from a list of API clients, the CustomEsiClient shall expose exactly those clients.
    A getter for a client the builder was not given returns undefined rather
    than a client that was never configured.

    Scenario: A client built with market and status exposes those two alone
      When a custom client is built with the "market" and "status" clients
      Then the custom client shall list "market,status" as its enabled clients
      And the custom client shall expose the "status" client
      And the custom client shall not expose the "route" client

  Rule: When the same API client is added to the builder twice, the EsiClientBuilder shall enable it once.
    Adding a client is idempotent, so code that composes a builder from
    several feature flags cannot enable a client twice.

    Scenario: Adding status twice enables it once
      When a custom client is built with the "status" and "status" clients
      Then the custom client shall list "status" as its enabled clients

  Rule: If a custom client is built with no API clients, then the EsiClientBuilder shall throw an error naming the missing client type.
    A client with nothing to call is a configuration mistake worth catching at
    startup.

    Scenario: Building with no clients is refused
      When a custom client is built with no clients
      Then the builder shall throw "At least one client type must be specified"

  Rule: When a custom client calls an endpoint, the CustomEsiClient shall identify itself with the configured client ID in the X-User-Agent header.
    The built client runs the same pipeline as EsiClient, so CCP can reach
    the application behind a request whichever surface built it.

    Scenario: A custom client asks the server status as its own application
      Given ESI reports the server status
      When a custom client built with the "status" client and the client ID "fleet-tool" requests the server status
      Then the request shall carry the header "X-User-Agent" with the value "fleet-tool"
      And the custom client's result shall report the server status
