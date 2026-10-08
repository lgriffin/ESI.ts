Feature: SDE Ingestion
  The ingestion pipeline turns CCP's published export into what the provider
  loads: the downloader finds the latest build and fetches the archive, the
  extractor reads the archive's metadata and files, the database builder
  writes a SQLite file for tools that want one, and the transforms reshape
  each record on the way — English text out of a locale map, Id in place of
  CCP's ID suffix, the build out of a nested metadata block.

  Nothing here reaches the network: the downloader's fetch is answered at
  the transport seam, and the files live in a temporary directory.

  # ── The downloader ───────────────────────────────────────────────────

  Rule: When the latest build is requested, the SdeDownloader shall return the build number and release date on the last line of the latest-build feed.
    CCP's feed is JSON lines, one per published build, newest last. The
    last line is the current build.

    Scenario: The newest line of the feed is the latest build
      Given the latest-build feed lists build "2026-09-08.1" then build "2026-09-15.1" released "2026-09-15"
      When I ask the downloader for the latest build
      Then the build number shall be "2026-09-15.1"
      And the release date shall be "2026-09-15"

  Rule: If the latest-build feed answers with an HTTP error status, then the SdeDownloader shall throw an SdeError naming the status.
    A feed outage must not read as "no new build"; the error names the
    status so an operator can tell a CCP outage from a bug.

    Scenario: A 503 from the feed is an SDE error
      Given the latest-build feed answers with HTTP 503
      When I ask the downloader for the latest build
      Then the call shall fail with an SDE error naming "HTTP 503"

  Rule: When the archive is downloaded, the SdeDownloader shall write every byte of the response to the output path and report progress up to the content length.
    The archive is hundreds of megabytes, so it is streamed to disk and the
    caller can show progress against the content length.

    Scenario: A 4096-byte archive lands on disk with progress reported
      Given the archive download serves 4096 bytes
      When I download the archive to a temporary file
      Then the downloaded file shall hold 4096 bytes
      And the downloaded file shall hold the bytes that were served
      And the last progress report shall be 4096 of 4096 bytes

  Rule: If the archive download answers with an HTTP error status, then the SdeDownloader shall throw an SdeError naming the status.
    A failed download leaves no partial archive behind that a later step
    might try to read; the error names the status.

    Scenario: A 404 from the download is an SDE error
      Given the archive download answers with HTTP 404
      When I download the archive to a temporary file
      Then the call shall fail with an SDE error naming "HTTP 404"

  # ── The extractor ────────────────────────────────────────────────────

  Rule: When an archive's metadata is read, the SdeExtractor shall return the build number and release date from the _sde.yaml inside it.
    The build is what a cache key and a version record are made of, so it
    is read before any table is parsed.

    Scenario: The archive's _sde.yaml gives the build
      Given an SDE directory holding the raw export files
      And a ZIP archive of that SDE directory
      When I read the archive metadata
      Then the build number shall be "2026-09-15.1"
      And the release date shall be "2026-09-15"

  Rule: If an archive holds no _sde.yaml, then the SdeExtractor shall throw an SdeError naming the file.
    An archive without metadata is not CCP's export; refusing it early
    beats loading tables with no build to attribute them to.

    Scenario: An archive without metadata is refused
      Given an SDE directory holding the raw export files without _sde.yaml
      And a ZIP archive of that SDE directory
      When I read the archive metadata
      Then the call shall fail with an SDE error naming "_sde.yaml"

  Rule: When an archive's files are listed, the SdeExtractor shall return the name of every YAML entry in it.
    The listing is what a drift check compares against the file registry,
    so it must name every YAML file and nothing else.

    Scenario: Every YAML file in the archive is listed
      Given an SDE directory holding the raw export files
      And a ZIP archive of that SDE directory
      When I list the YAML files in the archive
      Then the listed files shall be "_sde.yaml, groups.yaml, types.yaml"

  Rule: When named files are parsed from an archive, the SdeExtractor shall return one parsed file per name the archive holds, its records keyed by ID, and skip a name the archive lacks.
    A build may lack a table the registry knows; parsing skips it so the
    rest of the export still loads.

    Scenario: Present files are parsed and an absent one is skipped
      Given an SDE directory holding the raw export files
      And a ZIP archive of that SDE directory
      When I parse "types.yaml, blueprints.yaml, groups.yaml" from the archive
      Then the parsed files shall be "types.yaml, groups.yaml"
      And the parsed file "types.yaml" shall hold 2 records

  # ── The database builder ─────────────────────────────────────────────

  Rule: When a database is built from parsed files, the SdeDatabaseBuilder shall write one table per parsed registry file holding every record, and the version, build date and import date to the sde_metadata table.
    The SQLite file is for tools outside this package; it carries the same
    provenance as the provider's version record.

    Scenario: The build writes the tables and the metadata
      Given an SDE directory holding the raw export files
      And a ZIP archive of that SDE directory
      When I build a SQLite database from the archive
      Then the database metadata shall record version "2026-09-15.1" built on "2026-09-15" and imported at "2026-09-28T12:00:00.000Z"
      And the database table "eve_types" shall hold 2 rows
      And the database table "eve_groups" shall hold 1 row

  Rule: When a record is written to the database, the SdeDatabaseBuilder shall store the English text of a localised field, the renamed ID-suffixed fields, and booleans as integers.
    SQLite has no boolean and no map type, so the build flattens each
    record the way the provider does, plus 1 and 0 for true and false.

    Scenario: Type 34 is stored flat
      Given an SDE directory holding the raw export files
      And a ZIP archive of that SDE directory
      When I build a SQLite database from the archive
      Then the database table "eve_types" row 34 shall have name "Tritanium"
      And the database table "eve_types" row 34 shall have groupId 18
      And the database table "eve_types" row 34 shall have published 1

  Rule: When a database is built, the SdeDatabaseBuilder shall give a table a column for every field any of its records carries.
    CCP leaves optional fields out of a record rather than writing null, so
    a field can first appear deep into a file. Taking the columns from a
    sample of leading records dropped such a field from every row.

    Scenario: A field only the 60th type carries is stored
      Given an SDE directory whose types file holds 60 types, only the last with a basePrice of 5
      And a ZIP archive of that SDE directory
      When I build a SQLite database from the archive
      Then the database table "eve_types" row 60 shall have basePrice 5

  # ── The transforms ───────────────────────────────────────────────────

  Rule: When a field name is normalised, the SDE field-name transform shall replace an ID that ends the name or precedes a capital letter with Id, and leave every other name unchanged.
    CCP's YAML writes groupID and blueprintTypeID; the typed records and
    the SQLite columns use the Id suffix throughout.

    Scenario: A trailing ID is renamed
      When the field name "groupID" is normalised
      Then the result shall be "groupId"

    Scenario: An ID before a capital letter is renamed
      When the field name "typeIDList" is normalised
      Then the result shall be "typeIdList"

    Scenario: A name already in Id form is unchanged
      When the field name "iconId" is normalised
      Then the result shall be "iconId"

  Rule: When English text is extracted from a field, the SDE locale transform shall return the en entry of a locale map, a plain string unchanged, and the fallback for a field that is neither.
    Names are localised maps in most files and plain strings in a few; a
    caller gets a string either way, and the fallback for a missing field.

    Scenario: The en entry of a locale map is returned
      When the English text is extracted from a field localised as en "Tritanium" and de "Tritanium-de"
      Then the result shall be "Tritanium"

    Scenario: A plain string is returned unchanged
      When the English text is extracted from the plain string "Pyerite"
      Then the result shall be "Pyerite"

    Scenario: An empty field gives the fallback
      When the English text is extracted from an empty field with fallback "n/a"
      Then the result shall be "n/a"

  Rule: When _sde.yaml text is parsed, the SDE metadata parser shall read the build number and release date from the sde block when one is present, and from the top level otherwise.
    CCP nests the fields under sde; older hand-written files put them at
    the top level. The nested block wins when both are present.

    Scenario: The nested block wins over the top level
      When the metadata text with build "2026-09-15.1" nested under sde and build "2020-01-01.1" at the top level is parsed
      Then the build number shall be "2026-09-15.1"

    Scenario: A top-level build is read when no block is present
      When the metadata text with build "2020-01-01.1" at the top level is parsed
      Then the build number shall be "2020-01-01.1"

  Rule: When a raw record is transformed for a registry file that injects its ID, the SDE record transform shall set the ID attribute from the record's key, rename ID-suffixed fields, and extract English text.
    Both the provider and the SQLite build reshape records through this
    transform; the SQLite one additionally flattens booleans to integers.

    Scenario: Type 34 is reshaped for the provider
      When record 34 of the types file is transformed for the provider
      Then the returned record shall carry type 34
      And the returned record shall be named "Tritanium"
      And the returned record shall carry group 18

    Scenario: Type 34 is reshaped for the SQLite build
      When record 34 of the types file is transformed for the SQLite build
      Then the returned record shall carry type 34
      And the returned record shall be named "Tritanium"
      And the returned record shall carry published 1
