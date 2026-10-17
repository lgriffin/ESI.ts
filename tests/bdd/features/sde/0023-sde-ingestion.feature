@ARCH-12
Feature: SDE Ingestion
  The ingestion pipeline turns CCP's published export into what the provider
  loads: the downloader finds the latest build and fetches the archive, the
  extractor reads the archive's metadata and files, and the transforms
  reshape each record on the way — English text out of a locale map, Id in
  place of CCP's ID suffix, the build out of a nested metadata block.

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

  @ARCH-13
  Rule: If the latest-build feed holds no line with text on it, then the SdeDownloader shall throw an SdeError saying the response held no data.
    An empty feed names no build at all. Reading it as one would hand a
    caller a build number of "undefined" to compare against.

    Scenario: A feed of blank lines is an SDE error
      Given the latest-build feed holds only blank lines
      When I ask the downloader for the latest build
      Then the call shall fail with an SDE error naming "SDE build info response contained no data"

  @ARCH-13
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

  @ARCH-13
  Rule: If the archive download answers with an HTTP error status, then the SdeDownloader shall throw an SdeError naming the status.
    A failed download leaves no partial archive behind that a later step
    might try to read; the error names the status.

    Scenario: A 404 from the download is an SDE error
      Given the archive download answers with HTTP 404
      When I download the archive to a temporary file
      Then the call shall fail with an SDE error naming "HTTP 404"

  @ARCH-13
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

  @ARCH-13
  Rule: If the caller aborts the archive download, then the SdeDownloader shall throw an SdeError naming the abort.
    The archive is large, so a caller passes an AbortSignal to give up on a
    slow download. The signal reaches the request itself.

    Scenario: Aborting while the response is delayed fails the download
      Given the archive download serves 4096 bytes after 1000 ms
      When I download the archive and abort it after 20 ms
      Then the call shall fail with an SDE error naming "This operation was aborted"

  @ARCH-13
  Rule: If the archive cannot be written to the output path, then the SdeDownloader shall throw an SdeError naming the write failure.
    A missing or read-only directory is found only when the first byte is
    written. The error says it was the write that failed, not the download.

    Scenario: A download into a missing directory is an SDE error
      Given the archive download serves 4096 bytes
      When I download the archive into a directory that does not exist
      Then the call shall fail with an SDE error naming "Failed to write SDE file"

  @ARCH-13
  Rule: If the caller sets a byte limit that is not a finite, non-negative number, then the SdeDownloader shall throw an SdeError naming the limit and send no request.
    The limit bounds how much of a remote archive is written to disk. A
    limit of NaN or Infinity would bound nothing, so it is refused before
    the download starts rather than read as no limit.

    Scenario Outline: A byte limit of <limit> is refused before the download
      When I download the archive with a byte limit of "<limit>"
      Then the call shall fail with an SDE error naming "maxBytes must be a finite, non-negative number, not <limit>"
      And no request shall have been sent

      Examples:
        | limit    |
        | -1       |
        | NaN      |
        | Infinity |

  @ARCH-13
  Rule: If the archive's content length is over the byte limit, then the SdeDownloader shall throw an SdeError naming the size and the limit.
    The default limit is 2 GiB. An export that declares itself larger is
    refused before a byte is written.

    Scenario: A 4096-byte archive is refused under a 4095-byte limit
      Given the archive download serves 4096 bytes
      When I download the archive with a byte limit of "4095"
      Then the call shall fail with an SDE error naming "the export is 4096 bytes, over the 4095-byte limit"
      And no file shall remain at the download path

    Scenario: A limit of zero bytes refuses any archive with content
      Given the archive download serves 4096 bytes
      When I download the archive with a byte limit of "0"
      Then the call shall fail with an SDE error naming "the export is 4096 bytes, over the 0-byte limit"
      And no file shall remain at the download path

  @ARCH-13
  Rule: If an archive with no content length passes the byte limit while it streams, then the SdeDownloader shall throw an SdeError naming the limit.
    A response can leave out its length, or state a false one. The bytes
    are counted as they arrive, so the limit holds either way.

    Scenario: An archive of unknown length is stopped at a 4095-byte limit
      Given the archive download serves 4096 bytes with no content length
      When I download the archive with a byte limit of "4095"
      Then the call shall fail with an SDE error naming "the download passed the 4095-byte limit before it ended"
      And no file shall remain at the download path

  Rule: When the archive is no larger than the byte limit, the SdeDownloader shall write all of it.
    The limit is the largest archive allowed, not the first size refused.

    Scenario: A 4096-byte archive is written under a 4096-byte limit
      Given the archive download serves 4096 bytes
      When I download the archive with a byte limit of "4096"
      Then the downloaded file shall hold 4096 bytes

    Scenario: A 4096-byte archive of unknown length is written under a 4096-byte limit
      Given the archive download serves 4096 bytes with no content length
      When I download the archive with a byte limit of "4096"
      Then the downloaded file shall hold 4096 bytes

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

  @ARCH-13
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

  Rule: When an archive whose every entry lands inside the directory is extracted, the SdeExtractor shall write each of its files there.
    The check that refuses an escaping name must not refuse a safe one: a
    folder entry ends in a slash, and a colon past the first character is
    an ordinary character in a Linux or macOS file name, not a drive letter.

    Scenario: An archive with its files in a folder is extracted with the folder
      Given an SDE directory holding the raw export files
      And a ZIP archive of that SDE directory inside a folder, with a text file beside it
      And an empty extraction directory
      When I extract the archive to that directory
      Then the extraction directory shall hold "README.txt, sde/_sde.yaml, sde/groups.yaml, sde/types.yaml"

    Scenario: A name with a colon after its first character is extracted
      Given a ZIP archive holding only the entries "notes/C:types.yaml, types.yaml"
      And an empty extraction directory
      When I extract the archive to that directory
      Then the extraction directory shall hold "notes/C:types.yaml, types.yaml"

  @ARCH-13
  Rule: If an archive is refused for entries that would land outside the directory, then the SdeExtractor shall name the count of those entries and the first of them.
    One crafted name is enough to refuse the archive. The count tells an
    operator whether it was a single bad entry or a pattern.

    Scenario: One escaping entry is counted as one entry
      Given a ZIP archive holding an entry named "../escaped.yaml" beside "types.yaml"
      And an empty extraction directory beside that archive
      When I try to extract the archive to that directory
      Then the extraction shall be refused with an SdeError saying "1 entry would land outside"
      And the extraction shall be refused with an SdeError saying "../escaped.yaml"

    Scenario: Two escaping entries are counted as two entries
      Given a ZIP archive holding entries named "../escaped.yaml" and "../climbed.yaml" beside "types.yaml"
      And an empty extraction directory beside that archive
      When I try to extract the archive to that directory
      Then the extraction shall be refused with an SdeError saying "2 entries would land outside"
      And the extraction shall be refused with an SdeError saying '(first: "../escaped.yaml")'

  # ── The transforms ───────────────────────────────────────────────────

  Rule: When a field name is normalised, the SDE field-name transform shall replace an ID that ends the name or precedes a capital letter with Id, and leave every other name unchanged.
    CCP's YAML writes groupID and blueprintTypeID; the typed records use
    the Id suffix throughout.

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
    The provider reshapes every record it loads through this transform.

    Scenario: Type 34 is reshaped for the provider
      When record 34 of the types file is transformed for the provider
      Then the returned record shall carry type 34
      And the returned record shall be named "Tritanium"
      And the returned record shall carry group 18

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
