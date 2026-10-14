@SEC-10
Feature: Security boundary
  The library trusts the consumer's code and configuration, and nothing that
  arrives from the network. Each Rule here holds one claimed property of the
  security model (guides/SECURITY-MODEL.md) against a hostile value ESI, EVE
  SSO or the SDE host could send, and is tagged with that property's id so
  the security model audit can find it.

  A guard applied at one entry point and not at its sibling is a gap, so a
  property with several entry points is one Rule with a scenario outline
  that walks every one of them.

  @sec-P8
  Rule: If ESI reports more than 1000 pages, then the client shall request no more than 1000 pages.
    X-Pages is a number the remote chooses. Without a bound, a response
    reporting a hundred million pages would start that many requests, so
    every pagination path reads it through the same bounded page count.

    Scenario Outline: Every pagination entry point applies the same cap
      Given ESI reports an "X-Pages" value of 100000000 for a paged route
      When the consumer walks the route through <entry point>
      Then no more than 1000 page requests shall reach the transport

      Examples:
        | entry point             |
        | a paged client method   |
        | the collecting iterator |
        | the async page iterator |

  @sec-P6 @TEST-11
  Rule: If ESI answers with a redirect to another host, then the client shall not send the request or the token to that host.
    The host allowlist is checked once, on the base URL, so a followed
    redirect would carry the request to a host nothing checked. The client
    asks fetch not to follow redirects and refuses the 3xx it gets back.

    Scenario: A redirect on an authenticated request is refused, not followed
      Given ESI answers the wallet balance request with a redirect to "https://attacker.example/wallet"
      When the client tries to request their wallet balance
      Then the call shall be rejected with an EsiError saying "Redirect refused"
      And every request shall have asked the transport not to follow redirects
      And only one request shall have reached the transport

  @sec-P9
  Rule: If an SDE archive holds an entry whose name resolves outside the output directory, then the SDE extractor shall refuse the archive and write no file.
    Entry names come from the downloaded archive. The extractor checks every
    name against the directory the caller named before it writes anything,
    rather than relying on the installed adm-zip to sanitise them.

    A name can leave the directory three ways: by climbing out with "..",
    by being absolute, or by starting with a Windows drive letter. A drive
    letter resolves inside the directory on Linux and macOS, so only the
    name check stops it there; the archive is refused on every platform.

    Scenario Outline: An archive entry that <escapes> is refused
      Given a ZIP archive holding an entry named "<entry>" beside "types.yaml"
      And an empty extraction directory beside that archive
      When I try to extract the archive to that directory
      Then the extraction shall be refused with an SdeError saying "would land outside"
      And no file shall have been written in or beside the extraction directory

      Examples:
        | escapes                              | entry             |
        | climbs out of the output directory   | ../escaped.yaml   |
        | is an absolute path                  | /tmp/escaped.yaml |
        | starts with a Windows drive letter   | C:escaped.yaml    |
