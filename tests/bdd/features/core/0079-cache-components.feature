@ARCH-04
Feature: The ETag cache, the cache store adapter, the write log and cache keys
  The pipeline caches through `ICache`: the built-in `ETagCacheManager`, or
  the `CacheStoreCache` adapter over a `CacheStore` the application supplies.
  A write log per cache tells a read in flight whether a write has since
  invalidated its path, and every entry is filed under a key that carries the
  client settings that vary ESI's answer.
  0065-shared-cache-store.feature specifies sharing a store between clients.
  These Rules hold each part to what a consumer reads from it: statistics,
  expiry, eviction, invalidation by path, clean-up, log lines and keys.

  The scenarios drive real caches that read a clock the scenario moves and
  log to a logger that records every line.

  # ── ETag cache statistics

  Rule: The ETag cache shall report its entry count, hits, misses and the hit rate as hits divided by reads.
    A dashboard plots these figures; a hit rate of 0 before any read keeps
    the figure a number.

    Scenario: Three hits and one miss report a hit rate of 0.75
      Given an ETag cache with the default settings
      And the cache stores "/status/" with ETag "s1"
      When the cache is read for "/status/" 3 times
      And the cache is read for "/alliances/"
      Then the cache statistics shall report 1 entries, 3 hits and 1 misses
      And the cache hit rate shall be 0.75

    Scenario: An unread cache reports a hit rate of 0
      Given an ETag cache with the default settings
      Then the cache statistics shall report 0 entries, 0 hits and 0 misses
      And the cache hit rate shall be 0

  Rule: The ETag cache shall report the earliest and the latest time an entry it holds was stored.
    Replacing an entry restamps it; the order entries were first stored in
    does not decide the figures.

    Scenario: The middle entry is the oldest once the first is stored again
      Given an ETag cache with the default settings
      And the cache stores "/a/" with ETag "a1"
      And 100 ms pass on the cache clock
      And the cache stores "/b/" with ETag "b1"
      And 100 ms pass on the cache clock
      And the cache stores "/c/" with ETag "c1"
      And 100 ms pass on the cache clock
      And the cache stores "/a/" with ETag "a2"
      Then the oldest cache entry shall be 100 ms after the clock start
      And the newest cache entry shall be 300 ms after the clock start

    Scenario: An empty cache reports no entry times
      Given an ETag cache with the default settings
      Then the cache shall report no oldest and no newest entry

  # ── ETag cache expiry

  Rule: When an entry is read after its TTL has passed, the ETag cache shall drop the entry and count a miss.

    Scenario: An entry read 1 ms after a 1000 ms TTL is gone
      Given an ETag cache with the default settings
      And the cache stores "/status/" with ETag "s1" and a TTL of 1000 ms
      And 1001 ms pass on the cache clock
      When the cache is read for "/status/"
      Then the read shall find no entry
      And the cache statistics shall report 0 entries, 0 hits and 1 misses
      And the cache logger shall have received the debug line "Cache entry expired for /status/" naming the URL "/status/"

  Rule: While an entry's age equals its TTL, the ETag cache shall serve the entry.

    Scenario: An entry read exactly 1000 ms after a 1000 ms TTL is served
      Given an ETag cache with the default settings
      And the cache stores "/status/" with ETag "s1" and a TTL of 1000 ms
      And 1000 ms pass on the cache clock
      Then the cache shall hold "/status/"
      And reading "/status/" from the cache shall give ETag "s1"

  Rule: The ETag cache shall report an entry as held while the entry is within its TTL and as not held after it.

    Scenario: An entry is held at 999 ms and not at 1001 ms
      Given an ETag cache with the default settings
      And the cache stores "/status/" with ETag "s1" and a TTL of 1000 ms
      And 999 ms pass on the cache clock
      Then the cache shall hold "/status/"
      When 2 ms pass on the cache clock
      Then the cache shall not hold "/status/"

  Rule: The ETag cache shall keep an entry stored with a TTL of 0 until the entry is replaced, deleted or evicted.
    A TTL of 0 means the entry does not expire by age.

    Scenario: An entry with a TTL of 0 is still served after ten days
      Given an ETag cache with the default settings
      And the cache stores "/status/" with ETag "s1" and a TTL of 0 ms
      And 864000000 ms pass on the cache clock
      Then reading "/status/" from the cache shall give ETag "s1"

  Rule: Where no TTL is given, the ETag cache shall keep an entry for 5 minutes.

    Scenario: An entry without a TTL is served at 5 minutes and dropped after
      Given an ETag cache with the default settings
      And the cache stores "/status/" with ETag "s1"
      And 300000 ms pass on the cache clock
      Then the cache shall hold "/status/"
      When 1 ms pass on the cache clock
      Then the cache shall not hold "/status/"

  # ── ETag cache eviction

  Rule: When a full ETag cache stores a new URL, the ETag cache shall evict the entry stored earliest and log the evicted URL.
    Of two entries stored at the same time, the one stored first goes.

    Scenario: The first of two entries stored at the same time is evicted
      Given an ETag cache holding at most 2 entries
      And the cache stores "/a/" with ETag "a1"
      And the cache stores "/b/" with ETag "b1"
      And the cache stores "/c/" with ETag "c1"
      Then the cache shall not hold "/a/"
      And the cache shall hold "/b/"
      And the cache shall hold "/c/"
      And the cache logger shall have received the debug line "Evicted oldest cache entry: /a/" naming the URL "/a/"

    Scenario: The entry with the oldest stamp is evicted, wherever the entry sits
      Given an ETag cache holding at most 3 entries
      And the cache stores "/a/" with ETag "a1"
      And 100 ms pass on the cache clock
      And the cache stores "/b/" with ETag "b1"
      And 100 ms pass on the cache clock
      And the cache stores "/c/" with ETag "c1"
      And 100 ms pass on the cache clock
      And the cache stores "/a/" with ETag "a2"
      And the cache stores "/d/" with ETag "d1"
      Then the cache shall not hold "/b/"
      And the cache shall hold "/a/"
      And the cache shall hold "/c/"

  # ── ETag cache invalidation by path

  Rule: When entries are invalidated by a path, the ETag cache shall delete exactly the entries whose URL contains the path and report the number deleted.

    Scenario: Two of three entries fall under the path
      Given an ETag cache with the default settings
      And the cache stores "/characters/1/contacts/" with ETag "c1"
      And the cache stores "/characters/1/contacts/labels/" with ETag "l1"
      And the cache stores "/characters/1/wallet/" with ETag "w1"
      When the cache invalidates the path "/characters/1/contacts/"
      Then the invalidation shall report 2 deleted entries
      And the cache shall hold "/characters/1/wallet/"
      And the cache shall not hold "/characters/1/contacts/labels/"
      And the cache logger shall have received the debug line "Invalidated 2 cache entries matching /characters/1/contacts/" with the context '{"count":2}'

  Rule: If an invalidation by path matches no entry, then the ETag cache shall delete nothing and log nothing.

    Scenario: A path no entry falls under
      Given an ETag cache with the default settings
      And the cache stores "/characters/1/wallet/" with ETag "w1"
      When the cache invalidates the path "/corporations/"
      Then the invalidation shall report 0 deleted entries
      And the cache shall hold "/characters/1/wallet/"
      And the cache logger shall have received no line starting "Invalidated"

  # ── ETag cache clean-up

  Rule: When the ETag cache cleans up, the ETag cache shall delete every expired entry, report the number deleted and log the number.

    Scenario: One expired and one fresh entry
      Given an ETag cache with the default settings
      And the cache stores "/old/" with ETag "o1" and a TTL of 100 ms
      And the cache stores "/new/" with ETag "n1" and a TTL of 10000 ms
      And 200 ms pass on the cache clock
      When the cache cleans up
      Then the clean-up shall report 1 deleted entries
      And the cache statistics shall report 1 entries, 0 hits and 0 misses
      And the cache logger shall have received the debug line "Cleaned up 1 expired cache entries" with the context '{"cleanedCount":1}'

  Rule: The ETag cache shall clean up on the cleanup interval it was given.

    Scenario: A cache cleaning up every 5 ms drops an expired entry unread
      Given an ETag cache that cleans up every 5 ms
      And the cache stores "/old/" with ETag "o1" and a TTL of 100 ms
      And 200 ms pass on the cache clock
      When 40 ms of real time pass for the cache
      Then the cache statistics shall report 0 entries, 0 hits and 0 misses

  Rule: Where no cleanup interval is given, the ETag cache shall clean up once a minute.

    Scenario: An expired entry is still counted 40 ms later
      Given an ETag cache with the default cleanup interval
      And the cache stores "/old/" with ETag "o1" and a TTL of 100 ms
      And 200 ms pass on the cache clock
      When 40 ms of real time pass for the cache
      Then the cache statistics shall report 1 entries, 0 hits and 0 misses

  Rule: When the ETag cache is shut down, the ETag cache shall stop cleaning up and log that it shut down.

    Scenario: A shut-down cache keeps an expired entry
      Given an ETag cache that cleans up every 5 ms
      And the cache stores "/old/" with ETag "o1" and a TTL of 100 ms
      And 200 ms pass on the cache clock
      When the cache is shut down
      And 40 ms of real time pass for the cache
      Then the cache statistics shall report 1 entries, 0 hits and 0 misses
      And the cache logger shall have received the line "info ETag cache manager shut down"

  # ── ETag cache log lines

  Rule: When the ETag cache is created with a client, the ETag cache shall log its entry bound to the client's logger.

    Scenario: The startup line names 1000 entries
      Given an ETag cache with the default settings
      Then the cache logger shall have received the info line "ETag cache manager initialized with 1000 max entries" with the context '{"maxEntries":1000}'

  Rule: When a client is attached to the ETag cache after it was created, the ETag cache shall log to that client's logger.

    Scenario: A cache attached later logs its clear to the client
      Given an ETag cache attached to a client after it was created
      When the cache is cleared
      Then the cache logger shall have received the line "info ETag cache cleared"
      And the cache logger shall have received no line starting "ETag cache manager initialized"

  Rule: When the ETag cache stores or serves an entry, the ETag cache shall log a debug line naming the URL.

    Scenario: One store and one hit
      Given an ETag cache with the default settings
      And the cache stores "/status/" with ETag "s1"
      When the cache is read for "/status/"
      Then the cache logger shall have received the debug line "Cached response for /status/ with ETag s1" naming the URL "/status/"
      And the cache logger shall have received the debug line "Cache hit for /status/ with ETag s1" naming the URL "/status/"

  Rule: When the ETag cache configuration is updated, the ETag cache shall log the new entry bound.

    Scenario: The bound is raised to 50
      Given an ETag cache with the default settings
      When the cache's entry bound is set to 50
      Then the cache logger shall have received the info line "ETag cache configuration updated" with the context '{"maxEntries":50}'
      And the cache statistics shall report a bound of 50 entries

  # ── The cache store adapter

  Rule: The cache store adapter shall report the hits and misses of its own reads and the keys it wrote.

    Scenario: Three hits and one miss through the adapter
      Given a cache store adapter over a store that carries invalidations
      And the cache stores "/status/" with ETag "s1"
      When the cache is read for "/status/" 3 times
      And the cache is read for "/alliances/"
      Then the cache statistics shall report 1 entries, 3 hits and 1 misses
      And the cache hit rate shall be 0.75
      And the cache shall report no oldest and no newest entry

    Scenario: An unread adapter reports a hit rate of 0
      Given a cache store adapter over a store that carries invalidations
      Then the cache statistics shall report 0 entries, 0 hits and 0 misses
      And the cache hit rate shall be 0

  Rule: When the cache store adapter reads an entry, the cache store adapter shall return the entry's headers and TTL and the time the adapter wrote the entry.

    Scenario: An entry written with a TTL of 5000 ms
      Given a cache store adapter over a store that carries invalidations
      And the cache stores "/status/" with ETag "s1" and a TTL of 5000 ms
      When the cache is read for "/status/"
      Then the entry read shall carry the header "x-esi-request-id" "/status/"
      And the entry read shall carry a TTL of 5000 ms
      And the entry read shall be stamped 0 ms after the clock start

    Scenario: An entry written without a TTL
      Given a cache store adapter over a store that carries invalidations
      And the cache stores "/status/" with ETag "s1"
      When the cache is read for "/status/"
      Then the entry read shall carry no TTL

  Rule: When the cache store adapter misses a key it wrote, the cache store adapter shall stop counting the key.
    The store expired the entry on its own; the adapter learns it on a miss.

    Scenario: A key the store dropped
      Given a cache store adapter over a store that carries invalidations
      And the cache stores "/status/" with ETag "s1"
      And the store drops "/status/" on its own
      When the cache is read for "/status/"
      Then the read shall find no entry
      And the cache statistics shall report 0 entries, 0 hits and 1 misses

  Rule: The cache store adapter shall report a key as held while the store holds an entry for the key.

    Scenario: One stored and one missing key
      Given a cache store adapter over a store that carries invalidations
      And the cache stores "/status/" with ETag "s1"
      Then the cache shall hold "/status/"
      And the cache shall not hold "/alliances/"

  Rule: When the cache store adapter deletes a key, the cache store adapter shall delete the entry from the store and stop counting the key.

    Scenario: Deleting the only entry
      Given a cache store adapter over a store that carries invalidations
      And the cache stores "/status/" with ETag "s1"
      When the cache deletes "/status/"
      Then the cache shall not hold "/status/"
      And the cache statistics shall report 0 entries, 0 hits and 0 misses

  Rule: When the cache store adapter invalidates a path, the cache store adapter shall delete the keys it wrote under the path, report the number deleted and publish the path.

    Scenario: Two of three keys fall under the path
      Given a cache store adapter over a store that carries invalidations
      And the cache stores "/characters/1/contacts/" with ETag "c1"
      And the cache stores "/characters/1/contacts/labels/" with ETag "l1"
      And the cache stores "/characters/1/wallet/" with ETag "w1"
      When the cache invalidates the path "/characters/1/contacts/"
      Then the invalidation shall report 2 deleted entries
      And the cache statistics shall report 1 entries, 0 hits and 0 misses
      And the store shall have published the invalidations "path /characters/1/contacts/"

  Rule: When the cache store adapter is cleared, the cache store adapter shall empty the store, forget its keys and counts, and publish the clear.

    Scenario: Clearing after a hit
      Given a cache store adapter over a store that carries invalidations
      And the cache stores "/status/" with ETag "s1"
      And the cache is read for "/status/"
      When the cache is cleared
      Then the store shall hold 0 entries
      And the cache statistics shall report 0 entries, 0 hits and 0 misses
      And the store shall have published the invalidations "clear"

  Rule: When the cache store adapter is shut down, the cache store adapter shall shut the store down and stop applying invalidations from other holders.

    Scenario: A path published after the shutdown leaves the key counted
      Given a cache store adapter over a store that carries invalidations
      And the cache stores "/characters/1/contacts/" with ETag "c1"
      When the cache is shut down
      And another holder of the store invalidates the path "/characters/1/contacts/"
      Then the store shall have been shut down 1 time
      And the cache statistics shall report 1 entries, 0 hits and 0 misses

  Rule: When another holder of the store invalidates a path, the cache store adapter shall delete the keys it wrote under the path and record the write.

    Scenario: Another holder's write to the contacts
      Given a cache store adapter over a store that carries invalidations
      And the cache stores "/characters/1/contacts/" with ETag "c1"
      And the cache stores "/characters/1/wallet/" with ETag "w1"
      And the cache's write generation is noted
      When another holder of the store invalidates the path "/characters/1/contacts/"
      Then the cache shall not hold "/characters/1/contacts/"
      And the cache statistics shall report 1 entries, 0 hits and 0 misses
      And a read of "/characters/1/contacts/" in flight since the noted generation shall be invalidated

  Rule: When another holder of the store clears the store, the cache store adapter shall keep counting the keys it wrote.
    A key written here after the clear but before the event arrived must stay
    deletable.

    Scenario: Another holder's clear
      Given a cache store adapter over a store that carries invalidations
      And the cache stores "/status/" with ETag "s1"
      When another holder of the store clears the store
      Then the cache statistics shall report 1 entries, 0 hits and 0 misses

  Rule: When another holder of the store invalidates a path, the cache store adapter shall detach the matching in-flight reads from every deduplicator attached to the adapter.

    Scenario: A read started after the invalidation is sent again
      Given a cache store adapter over a store that carries invalidations
      And a deduplicator attached to the cache
      And a read of "/characters/1/contacts/" is in flight through the deduplicator
      When another holder of the store invalidates the path "/characters/1/contacts/"
      And the same read is started through the deduplicator
      Then the deduplicator shall have sent 2 reads

  Rule: The cache store adapter shall forget the key written least recently when the adapter has written more than 10000 keys.

    Scenario: 10001 keys leave 10000 counted
      Given a cache store adapter over a store that carries invalidations
      When the cache stores 10001 numbered items
      Then the cache statistics shall report 10000 entries, 0 hits and 0 misses

    Scenario: A key written again is forgotten after the others
      Given a cache store adapter over a store that carries invalidations
      And the cache stores 10000 numbered items
      And the cache stores "/item/0/" with ETag "again"
      When the cache stores "/item/10000/" with ETag "new"
      And the cache invalidates the path "/item/0/"
      Then the invalidation shall report 1 deleted entries

  # ── Which cache a store becomes

  Rule: When a store implements getETag, has, deleteByPath and getStats, the pipeline shall use the store as its cache.

    Scenario: An ETag cache given as the store is used as itself
      Given an ETag cache with the default settings
      Then the cache made from the ETag cache shall be the ETag cache itself

    Scenario: A store with all four calls is used as itself
      Given a store implementing every wider cache call
      Then the cache made from the store shall be the store itself

  Rule: If a store lacks one of getETag, has, deleteByPath and getStats, then the pipeline shall wrap the store in one cache store adapter shared by every client given the store.

    Scenario Outline: A store without <call> is wrapped once
      Given a store implementing every wider cache call but <call>
      Then the cache made from the store shall be an adapter
      And the cache made from the store a second time shall be the same adapter

      Examples:
        | call         |
        | getETag      |
        | has          |
        | deleteByPath |
        | getStats     |

  Rule: When the pipeline wraps a store, the cache store adapter shall stamp the writes it makes on the clock of the first client given the store.

    Scenario: A write stamped on the scenario clock
      Given a plain cache store
      When the cache made from the store with the scenario clock stores "/status/"
      Then the entry the adapter reads for "/status/" shall be stamped 0 ms after the clock start

  # ── The write log

  Rule: When a path is invalidated after a read was sent, the write log shall report the read under that path as invalidated.

    Scenario: A write to the read's path
      Given an ETag cache with the default settings
      And the cache's write generation is noted
      When a write to "/characters/1/wallet/" is recorded
      And a write to "/characters/1/contacts/" is recorded
      Then a read of "/characters/1/contacts/?page=1" in flight since the noted generation shall be invalidated

  Rule: If no write since a read was sent covers its path, then the write log shall not report the read as invalidated.

    Scenario: A write to another path
      Given an ETag cache with the default settings
      And a write to "/characters/1/contacts/" is recorded
      And the cache's write generation is noted
      When a write to "/characters/1/wallet/" is recorded
      Then a read of "/characters/1/contacts/" in flight since the noted generation shall not be invalidated

    Scenario: No write at all
      Given an ETag cache with the default settings
      And the cache's write generation is noted
      Then a read of "/characters/1/contacts/" in flight since the noted generation shall not be invalidated

  Rule: The write log shall remember the last 64 writes and report a read that outlived more writes than that as invalidated.

    Scenario: 64 writes to other paths leave the read standing
      Given an ETag cache with the default settings
      And the cache's write generation is noted
      When 64 writes to other paths are recorded
      Then a read of "/characters/1/contacts/" in flight since the noted generation shall not be invalidated

    Scenario: 65 writes to other paths overtake the read
      Given an ETag cache with the default settings
      And the cache's write generation is noted
      When 65 writes to other paths are recorded
      Then a read of "/characters/1/contacts/" in flight since the noted generation shall be invalidated

  # ── Cache keys

  Rule: Where a client uses the default host, tenant, language and compatibility date, the cache key shall be the bare URL.

    Scenario: A default client holding a token keys a request without auth by its URL
      Given a cache key client holding a token for character 90000001
      Then the cache keys for "/status/" without auth shall all be "/status/"

  Rule: Where a client differs from the defaults in host, tenant, language or compatibility date, the cache key shall name each difference.

    Scenario Outline: A client with <setting> keys by <prefix>
      Given a cache key client with <setting>
      Then the cache keys for "/status/" without auth shall all be "<prefix>/status/"

      Examples:
        | setting                              | prefix                                     |
        | the host "https://esi.example.test"  | [host=https://esi.example.test]            |
        | the language "de"                    | [lang=de]                                  |
        | the compatibility date "2020-01-01"  | [compat=2020-01-01]                        |
        | the tenant "tranquility"             | [tenant=tranquility]                       |
        | the default compatibility date       |                                            |

    Scenario: A client with a tenant and a language names both
      Given a cache key client with the tenant "singularity"
      And the cache key client uses the language "fr"
      Then the cache keys for "/status/" without auth shall all be "[tenant=singularity;lang=fr]/status/"

  Rule: Where a request needs auth, the conditional cache key shall name the character the token claims.

    Scenario: A token for character 90000001
      Given a cache key client holding a token for character 90000001
      Then the conditional cache key for "/characters/90000001/wallet/" with auth shall be "character:90000001:/characters/90000001/wallet/"

  Rule: When ESI accepts a 65th token for a client, the cache keys shall stop trusting the character in the token accepted earliest.

    Scenario: The first of 65 accepted tokens is no longer trusted
      Given a cache key client holding a token for character 90000001
      And ESI accepts the client's token
      And ESI accepts tokens for 63 other characters
      And ESI accepts the client's token again
      Then the cache key for "/characters/90000001/wallet/" with auth shall name character 90000001
      When ESI accepts a token for one more character
      Then the cache key for "/characters/90000001/wallet/" with auth shall not name a character
