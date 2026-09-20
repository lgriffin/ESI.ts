Feature: SDE Version Management
  The Static Data Export is republished whenever CCP patches the game, so a
  loaded data set is only meaningful alongside the release it came from. The
  MemorySdeProvider carries that provenance as a version record: the SDE
  version string, the date CCP built it, the date this process imported it,
  and an optional checksum of the source.

  Callers read this to decide whether cached derivations are still valid and
  to report which data set an answer came from.

  # ── Version metadata from the loaded data set ────────────────────────

  Rule: When the SDE version is queried, the MemorySdeProvider shall return the version string, build date, import date, and checksum recorded in the loaded data set.
    All four values come straight from the data set the provider was
    constructed with, so a caller can distinguish two imports of the same CCP
    release and can compare checksums to detect a substituted source.

    Scenario: Version record reports the values supplied with the data set
      Given an SDE provider with version metadata
      When the user queries the SDE version
      Then the provider shall return version, build date, and import date

  # ── Falling back to constructor defaults ─────────────────────────────

  Rule: If a MemorySdeProvider is constructed with no version metadata, then the MemorySdeProvider shall return a version record whose version string, build date, and import date are all defined.
    An empty provider is a legitimate starting state — a test fixture, or a
    provider populated later — and querying its version must not yield
    undefined fields that a caller would then have to guard against. The
    constructor substitutes placeholder values instead.

    Scenario: Empty provider reports placeholder version fields
      Given an SDE provider with no version configuration
      When the user queries the SDE version
      Then the provider shall return default version information
