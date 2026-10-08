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

    Scenario: A line of spaces after the newest build is passed over
      Given the latest-build feed lists build "2026-09-15.1" released "2026-09-15" then a line of spaces
      When I ask the downloader for the latest build
      Then the build number shall be "2026-09-15.1"

  Rule: If the latest-build feed holds no line with text on it, then the SdeDownloader shall throw an SdeError saying the response held no data.
    An empty feed names no build at all. Reading it as one would hand a
    caller a build number of "undefined" to compare against.

    Scenario: A feed of blank lines is an SDE error
      Given the latest-build feed holds only blank lines
      When I ask the downloader for the latest build
      Then the call shall fail with an SDE error naming "SDE build info response contained no data"

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

  Rule: If the archive download answers with no body, then the SdeDownloader shall throw an SdeError saying the response body is empty.
    A success status with nothing to stream would otherwise leave an empty
    file where the archive should be.

    Scenario: A 204 from the download is an SDE error
      Given the archive download answers with HTTP 204
      When I download the archive to a temporary file
      Then the call shall fail with an SDE error naming "response body is empty"

  Rule: While the archive download carries no content length, the SdeDownloader shall make no progress report.
    Progress is a share of a known total. Without one there is nothing to
    report against, so the download goes ahead silently.

    Scenario: A download with no content length reports no progress
      Given the archive download serves 4096 bytes with no content length
      When I download the archive to a temporary file
      Then the downloaded file shall hold 4096 bytes
      And no progress report shall have been made

  Rule: If the caller aborts the archive download, then the SdeDownloader shall throw an SdeError naming the abort.
    The archive is large, so a caller passes an AbortSignal to give up on a
    slow download. The signal reaches the request itself.

    Scenario: Aborting while the response is delayed fails the download
      Given the archive download serves 4096 bytes after 1000 ms
      When I download the archive and abort it after 20 ms
      Then the call shall fail with an SDE error naming "This operation was aborted"

  Rule: If the archive cannot be written to the output path, then the SdeDownloader shall throw an SdeError naming the write failure.
    A missing or read-only directory is found only when the first byte is
    written. The error says it was the write that failed, not the download.

    Scenario: A download into a missing directory is an SDE error
      Given the archive download serves 4096 bytes
      When I download the archive into a directory that does not exist
      Then the call shall fail with an SDE error naming "Failed to write SDE file"

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

    Scenario: A folder entry and a text file are left out of the listing
      Given an SDE directory holding the raw export files
      And a ZIP archive of that SDE directory inside a folder, with a text file beside it
      When I list the YAML files in the archive
      Then the listed files shall be "sde/_sde.yaml, sde/groups.yaml, sde/types.yaml"

  Rule: When named files are parsed from an archive, the SdeExtractor shall return one parsed file per name the archive holds, its records keyed by ID, and skip a name the archive lacks.
    A build may lack a table the registry knows; parsing skips it so the
    rest of the export still loads.

    Scenario: Present files are parsed and an absent one is skipped
      Given an SDE directory holding the raw export files
      And a ZIP archive of that SDE directory
      When I parse "types.yaml, blueprints.yaml, groups.yaml" from the archive
      Then the parsed files shall be "types.yaml, groups.yaml"
      And the parsed file "types.yaml" shall hold 2 records

    Scenario: A file inside a folder of the archive is found by its name
      Given an SDE directory holding the raw export files
      And a ZIP archive of that SDE directory inside a folder, with a text file beside it
      When I parse "types.yaml" from the archive
      Then the parsed files shall be "types.yaml"
      And the parsed file "types.yaml" shall hold 2 records

  Rule: When an archive is extracted to a directory, the SdeExtractor shall write every entry of the archive there, replacing a file of the same name.
    A consumer that keeps an extracted export refreshes it in place. An
    older copy of a file must not survive the extraction of a newer one.

    Scenario: An older types file is replaced by the archive's
      Given an SDE directory holding the raw export files
      And a ZIP archive of that SDE directory
      And an extraction directory already holding "types.yaml" reading "stale"
      When I extract the archive to that directory
      Then the extracted "types.yaml" shall hold the bytes of the SDE directory's copy
      And the extracted "groups.yaml" shall hold the bytes of the SDE directory's copy

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

  Rule: When a database is built, the SdeDatabaseBuilder shall type each column after the first value any record holds for it, as INTEGER, REAL or TEXT, and make the ID attribute the primary key.
    SQLite only advises a column type, so the declared one is what a tool
    reading the file goes by. A whole number first makes the column INTEGER
    even when a later record holds a fraction; a column first seen as null
    or as text is TEXT.

    Scenario: The types table is typed from type 34's values
      Given an SDE directory holding the schema export files
      And a ZIP archive of that SDE directory
      When I build a SQLite database from the archive
      Then the database table "eve_types" shall have columns "typeId INTEGER PRIMARY KEY, name TEXT, groupId INTEGER, volume INTEGER, basePrice TEXT, traits TEXT"
      And the database table "eve_types" row 35 shall have volume 0.01

  Rule: When a table whose IDs are strings is built, the SdeDatabaseBuilder shall store its IDs in a TEXT primary key.
    Translation languages, character titles and military campaigns are keyed
    by codes. An INTEGER key would refuse every one of them.

    Scenario: Translation languages are keyed by their codes
      Given an SDE directory holding the schema export files
      And a ZIP archive of that SDE directory
      When I build a SQLite database from the archive
      Then the database table "eve_translation_languages" shall have columns "translationLanguageId TEXT PRIMARY KEY, name TEXT"
      And the database table "eve_translation_languages" shall hold 2 rows

  Rule: When a file whose records keep their own IDs is built, the SdeDatabaseBuilder shall add no column for the record's key.
    The registry marks a few files as not injecting the key: their records
    are stored with the fields CCP wrote and nothing more.

    Scenario: Character titles are stored without their key
      Given an SDE directory holding the schema export files
      And a ZIP archive of that SDE directory
      When I build a SQLite database from the archive
      Then the database table "eve_character_titles" shall have columns "name TEXT"

  Rule: When a record is written to the database, the SdeDatabaseBuilder shall store a null field as NULL and a nested field as its JSON text.
    SQLite has no map or list type. A nested value is kept whole as JSON a
    reader can parse, with CCP's own keys; a null stays a null, not the
    text "null".

    Scenario: Type 34's null base price and nested traits are stored
      Given an SDE directory holding the schema export files
      And a ZIP archive of that SDE directory
      When I build a SQLite database from the archive
      Then the database table "eve_types" row 34 shall have a null basePrice
      And the database table "eve_types" row 34 shall hold traits as the JSON '{"iconID":7,"roleBonuses":[{"bonus":5}]}'

  Rule: If a parsed file holds no records, then the SdeDatabaseBuilder shall create no table for it.
    An empty file says nothing about the columns a table would need, and a
    table with none is not valid SQL.

    Scenario: An empty market groups file leaves no market groups table
      Given an SDE directory holding the schema export files
      And a ZIP archive of that SDE directory
      When I build a SQLite database from the archive
      Then the database shall have no table "eve_market_groups"

  Rule: When a database is built, the SdeDatabaseBuilder shall leave the file in WAL journal mode with no write-ahead file beside it.
    WAL lets tools read the file while another process holds it open.
    Closing the database at the end folds the write-ahead file back in, so
    the one file holds every row and can be copied on its own.

    Scenario: The built file is in WAL mode and stands alone
      Given an SDE directory holding the raw export files
      And a ZIP archive of that SDE directory
      When I build a SQLite database from the archive
      Then the database shall be in WAL journal mode with no write-ahead file beside it

  Rule: While a table is being written, the SdeDatabaseBuilder shall report progress after every 1000 records and once more when the table is done.
    A full export writes hundreds of thousands of rows. The reports give the
    rows written so far and the table's total.

    Scenario: 1001 types are reported at 1000 and at 1001
      Given an SDE directory whose types file holds 1001 types
      And a ZIP archive of that SDE directory
      When I build a SQLite database from the archive
      Then the progress reports for "eve_types" shall be "1000 of 1001, 1001 of 1001"

  Rule: If a record cannot be stored, then the SdeDatabaseBuilder shall throw an SdeDatabaseError naming the table and the record's ID.
    A record that breaks its table's types fails the whole build. The error
    names where the bad record is, so it can be found in a file of
    thousands.

    Scenario: A type whose typeID is not a number fails the build
      Given an SDE directory whose type 34 carries a typeID that is not a number
      And a ZIP archive of that SDE directory
      When I build a SQLite database from the archive
      Then the call shall fail with an SDE database error naming "Failed to insert into eve_types (id=34)"

  Rule: If the database file cannot be created, then the SdeDatabaseBuilder shall throw an SdeDatabaseError saying the build failed.
    SQLite's own error is kept as the cause. The message says it was the
    database build, not the download or the parse, that failed.

    Scenario: A build into a missing directory fails
      Given an SDE directory holding the raw export files
      And a ZIP archive of that SDE directory
      When I build a SQLite database from the archive into a directory that does not exist
      Then the call shall fail with an SDE database error naming "Failed to build SDE database"

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

  Rule: When a build field of _sde.yaml is a number, the SDE metadata parser shall read it as its digits, and a field of any other type than text or a number as empty text.
    YAML reads an unquoted build such as 3141592 as a number. The version
    record is text either way; a value that is neither, such as a stray
    boolean, gives nothing rather than "true".

    Scenario: A numeric build is read as digits and a boolean date as empty
      When the metadata text with build number 3141592 and a release date of true is parsed
      Then the build number shall be "3141592"
      And the release date shall be ""

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

  Rule: When a raw record is transformed for the provider, the SDE record transform shall reshape a nested field at every depth and keep a null field as null.
    The provider serves nested values as objects, not JSON text, so the
    renaming and the English text reach inside them: an iconID two levels
    down reads iconId like a top-level one.

    Scenario: Type 34's nested traits and null base price are reshaped
      When record 34 of the schema export's types.yaml file is transformed for the provider
      Then the returned record shall have traits equal to the JSON '{"iconId":7,"roleBonuses":[{"bonus":5}]}'
      And the returned record shall have basePrice equal to the JSON 'null'

  Rule: When a raw record of a registry file whose records keep their own IDs is transformed, the SDE record transform shall add no ID attribute.
    The registry marks a few files as not injecting the key. Their records
    carry the fields CCP wrote and no ID field built from the key.

    Scenario: A character title is reshaped for the provider without its key
      When record captain of the schema export's characterTitles.yaml file is transformed for the provider
      Then the returned record shall be named "Captain"
      And the returned record shall have no field "characterTitleId"

    Scenario: A character title is reshaped for the SQLite build without its key
      When record captain of the schema export's characterTitles.yaml file is transformed for the SQLite build
      Then the returned record shall be named "Captain"
      And the returned record shall have no field "characterTitleId"
