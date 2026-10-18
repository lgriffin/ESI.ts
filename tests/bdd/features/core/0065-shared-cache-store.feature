@ARCH-04
Feature: Invalidation across clients sharing a cache store
  A cache store given as the `cache` option can be shared by clients in
  several processes, as a Redis instance is. A write through one client
  invalidates the entries under the written path, but the store has no call
  that lists keys, so a client can drop only the entries it wrote itself. A
  store that also implements the optional `publishInvalidation` and
  `onInvalidate` pair (src/core/ports/CacheStore.ts) carries each
  invalidation to every other holder, which then drops the entries it wrote
  under that path.

  These scenarios give two seam EsiClients, a reader and a writer, their own
  handles on one shared store, as two processes would hold, and count what
  reaches the transport seam.

  # ── A store that carries invalidations

  Rule: When an EsiClient writes to a path over a cache store that carries invalidations, every other EsiClient on that store shall send its next read of that path to ESI.
    The reader cached the contact list before the writer added a contact; its
    entry is still inside the spec TTL, so only the published invalidation
    stops it serving the list without the new contact.

    Scenario: Contacts cached by the reader are fetched again after the writer adds a contact
      Given two EsiClients sharing a cache store that carries invalidations
      And ESI reports the character's contacts with an ETag
      And ESI accepts a new contact for the character
      And ESI reports the character's contacts holding the new contact
      When the reader reads the character's contacts twice
      And the writer adds a contact for the character
      And the reader reads the character's contacts
      Then the runtime shall have sent 3 requests
      And the contacts read last shall hold the new contact

  @TEST-11
  Rule: If an EsiClient writes to a path over a cache store that carries invalidations, then every other EsiClient on that store shall not send a request for a fresh entry it cached under another path.
    An invalidation names the written path, so a write to a character's
    contacts leaves everything else the readers cached in place.

    Scenario: The server status cached by the reader is served after the writer adds a contact
      Given two EsiClients sharing a cache store that carries invalidations
      And ESI reports the server status with an ETag
      And ESI accepts a new contact for the character
      When the reader requests the server status
      And the writer adds a contact for the character
      And the reader requests the server status
      Then the runtime shall have sent 2 requests

  # ── A store without the invalidation hooks

  Rule: Where a cache store lacks the invalidation hooks, the EsiClient shall send its next read of a path it wrote to ESI.
    The pair is optional: a store with only the five required calls still
    serves as the cache, and a client still drops the entries it wrote under a
    path it writes to.

    Scenario: The writer's own cached contacts are fetched again after it adds a contact
      Given two EsiClients sharing a cache store without the invalidation hooks
      And ESI reports the character's contacts with an ETag
      And ESI accepts a new contact for the character
      And ESI reports the character's contacts holding the new contact
      When the writer reads the character's contacts
      And the writer adds a contact for the character
      And the writer reads the character's contacts
      Then the runtime shall have sent 3 requests
      And the contacts read last shall hold the new contact

  Rule: If a cache store lacks the invalidation hooks, then the EsiClient shall serve a fresh entry it cached under a path another EsiClient on that store wrote to without a request.
    Without the pair nothing tells the reader about the writer's write, so the
    reader keeps its entry until the entry's freshness runs out. This is the
    documented limit of such a store, pinned so that a change to it is seen.

    Scenario: The reader keeps serving its cached contacts after the writer adds a contact
      Given two EsiClients sharing a cache store without the invalidation hooks
      And ESI reports the character's contacts with an ETag
      And ESI accepts a new contact for the character
      When the reader reads the character's contacts
      And the writer adds a contact for the character
      And the reader reads the character's contacts
      Then the runtime shall have sent 2 requests
      And the contacts read last shall not hold the new contact
