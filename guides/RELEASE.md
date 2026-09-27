# Releasing ESI.ts

**Implements:** `REL-01`, `REL-02`, `REL-03`, `REL-04`, `REL-05`, `DOC-01` · requirements stated in [CHARTER.md](CHARTER.md) Part 8

How a version of `@lgriffin/esi.ts` goes from merged commits to a published, signed package. The workflows are the fact: `.github/workflows/release-please.yml`, `.github/workflows/release.yml`, `release-please-config.json` and `.release-please-manifest.json`. Where this guide and a workflow disagree, the workflow wins and the guide is the bug.

For what runs at commit, push and PR time, see [QUALITY-GATES.md](QUALITY-GATES.md). For why the signing and provenance controls exist, see [SECURITY.md](SECURITY.md).

---

## The path of a release

```
conventional commits on master
        │
        ▼
release-please.yml ──► release PR (version bump + changelog)
        │ merge
        ▼
tag vX.Y.Z + GitHub release published
        │
        ▼
release.yml
  validate-release ──┬─► publish-npm            (release event only)
                     ├─► publish-github         (release event only)
                     ├─► deploy-docs
                     └─► create-assets ──► sign-and-publish-assets (release event only)
                                                        │
                                                 notify-success
```

1. **Commits land on `master`** through a pull request. Each commit message follows the conventional-commit format (REL-01). The `commit-msg` Husky hook runs `commitlint` against `@commitlint/config-conventional`.
2. **release-please runs on every push to `master`.** It reads the commits since the last release, works out the next version, and opens or updates a release pull request, but only once a `feat:`, a breaking change (`type!:` or `BREAKING CHANGE:`) or a `Release-As:` footer has landed since the last tag. Fixes, chores and dependency bumps on their own open no release pull request; they wait and ship in the next minor or major (see [Release cadence](#release-cadence)). That pull request edits `package.json`, `.release-please-manifest.json`, `CHANGELOG.md` and the extra file `src/core/constants.ts`.
3. **Merging the release pull request** makes release-please create the `vX.Y.Z` tag and the GitHub release.
4. **`release.yml` runs twice**, once for the tag push (`v*.*.*`) and once for the `release: published` event. Both runs validate and build the assets. Only the `release` run, or a `workflow_dispatch` run on the tag, publishes packages, deploys the documentation, signs assets and then dispatches `post-publish-canary.yml`; those jobs are guarded by the event name.

### Jobs in `release.yml`

| Job                       | Needs                                    | Runs on                   | Does                                                                                                                                                                                                                                                        |
| ------------------------- | ---------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validate-release`        | —                                        | tag push and release      | The publish gate, below                                                                                                                                                                                                                                     |
| `publish-npm`             | `validate-release`, `consumer-contract`  | release only              | Re-checks `checksums.txt`, then `npm publish <tarball> --provenance` of the tarball `create-assets` packed, to `registry.npmjs.org`                                                                                                                         |
| `publish-github`          | `validate-release`, `consumer-contract`  | release only              | The same tarball, `npm publish <tarball> --provenance` to `npm.pkg.github.com`                                                                                                                                                                              |
| `deploy-docs`             | `validate-release`                       | release only              | Calls `docs-site.yml`: `npm run docs:site` (the VitePress site with TypeDoc under `/api/`), `validate:versions -- --site`, then deploys `docs-site/.vitepress/dist` to the `gh-pages` branch                                                                |
| `create-assets`           | `validate-release`                       | tag push and release      | `npm pack` (fails unless exactly one tarball), the CycloneDX SBOM (`npm run release:sbom`), `docs.tar.gz` of the API reference, `checksums.txt` (SHA-256); uploads as artifact                                                                              |
| `consumer-contract`       | `create-assets`                          | tag push and release      | The consumer contract (`npm run test:consumer -- --tarball`) against the tarball `create-assets` packed: Node 22 and 24, oldest, repository and latest TypeScript                                                                                           |
| `sign-and-publish-assets` | `create-assets`, `consumer-contract`     | release only              | Keyless `cosign sign-blob` on the tarball, SBOM and docs archive; SLSA build provenance for the same three (`actions/attest-build-provenance`, checked with `gh attestation verify`); then `gh release upload` of all assets plus `README.md` and `LICENSE` |
| `dispatch-canary`         | `publish-npm`, `sign-and-publish-assets` | when `publish-npm` passed | Dispatches `post-publish-canary.yml` on the tag (`actions: write`)                                                                                                                                                                                          |
| `notify-success`          | all of the above                         | when `publish-npm` passed | Log line only                                                                                                                                                                                                                                               |

The workflow holds top-level `contents: read`. Only `publish-npm`, `publish-github` and `sign-and-publish-assets` receive `id-token: write`, and signing sits in its own job so that no build step shares a job with the ability to mint an OIDC token.

`release.yml` also has a `workflow_dispatch` trigger. Dispatch it on the tag, `gh workflow run release.yml --ref vX.Y.Z`; `validate-release` fails on any other ref, and on a tag that does not match `package.json`. `release-please.yml` has a manual trigger with a `force-release` box, for shipping a patch on purpose (below).

### The release app token

Events raised with the workflow's `GITHUB_TOKEN` start no other workflow. A release PR opened with it waits for someone to approve its CI runs, and the tag and release it creates never start `release.yml` or `post-publish-canary.yml`. So `release-please.yml` runs release-please with a GitHub App installation token when the app is configured:

| Name                      | Kind             | Value                                        |
| ------------------------- | ---------------- | -------------------------------------------- |
| `RELEASE_APP_CLIENT_ID`   | Actions variable | The app's Client ID                          |
| `RELEASE_APP_PRIVATE_KEY` | Actions secret   | A private key generated for the app (`.pem`) |

The app is installed on this repository only, with repository permissions Contents, Pull requests and Issues set to read and write, no webhook, and nothing else. The token step asks for those three permissions only.

Without both, release-please falls back to `GITHUB_TOKEN`. Its release PR's CI then has to be approved in the Actions UI, and the `dispatch-release` job starts `release.yml` on the new tag (`workflow_dispatch` is exempt from the rule), unless a dispatched run for that tag already exists. Either way `release.yml` dispatches the canary itself once `publish-npm` has succeeded.

The same fallback applies when minting fails, for example because the app is not installed on the repository (the token API answers 404) or the key was deleted. The run carries a "Release app token" warning annotation saying so, and the release still goes out.

---

## Release cadence

Releases are cut for new features and breaking changes only. A gate step in `release-please.yml` scans the commits since the last `vX.Y.Z` tag and skips release-please's pull-request step unless one of them is a `feat:`, carries `!` or a `BREAKING CHANGE:` footer, or has a `Release-As:` footer. The release step always runs, so merging an existing release pull request still tags and publishes.

Once a release pull request is open (label `autorelease: pending`), the gate lets every later push through, so later fixes keep updating it, and they appear under **Fixed** in the changelog of that minor. To ship a fix on its own (a security or regression fix that cannot wait), run the workflow by hand with `force-release`:

```bash
gh workflow run release-please.yml -f force-release=true
```

That opens a patch release pull request; merge it as usual. A `Release-As: X.Y.Z` footer on a commit does the same without the manual run.

## Version bumps

release-please uses the `node` release type with `bump-minor-pre-major: false`, so semantic-versioning rules apply as written. Deciding which bump a change needs, and how to mark it, is in [SEMVER.md](SEMVER.md).

| Commit                                                       | Bump   | Changelog section |
| ------------------------------------------------------------ | ------ | ----------------- |
| `type!:` or a `BREAKING CHANGE:` footer, any type            | major  | as for the type   |
| `feat:`                                                      | minor  | Added             |
| `fix:`                                                       | patch¹ | Fixed             |
| `perf:`, `refactor:`, `chore:`                               | patch¹ | Changed           |
| `docs:`                                                      | patch¹ | Documentation     |
| `test:`                                                      | patch¹ | Testing           |
| `build:`, `ci:`, `style:`, `revert:` (allowed by commitlint) | none   | not listed        |

¹ Patch-level commits do not open a release on their own; they ride the next minor or major unless forced (see [Release cadence](#release-cadence)).

The section mapping lives in `changelog-sections` in `release-please-config.json`. A type missing from that list is accepted by commitlint but does not appear in the changelog.

Two practical consequences:

- **Squash titles matter.** A squash merge keeps only the pull request title as the commit, so the title carries the type and the `!`.
- **Dropping a supported Node line is a major bump** (REL-05). It needs a `!` and a changelog line, not a quiet edit to `engines`.
- **A public API break must be declared.** The `api-semver` job in `ci.yml` fails a pull request whose `etc/esi.ts.api.md` lost or changed a line unless one of its commits is `type!:` or has a `BREAKING CHANGE:` footer. If the change breaks no consumer, add an `API-Compatible: <why>` trailer instead. See GATE-03 in [QUALITY-GATES.md](QUALITY-GATES.md). Squash merging is allowed: when a declared break spans several commits, the gate also requires the pull request title to be `type!:`, because that title becomes the squash commit. Edit the title and re-run the failed jobs; no new push is needed.

---

## The changelog

`CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and Semantic Versioning.

- Work in progress is recorded under `## [Unreleased]` using the sections `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`, and `Breaking Changes` where needed.
- A release turns the unreleased block into `## [X.Y.Z] - YYYY-MM-DD`.
- `validate-release` fails if `CHANGELOG.md` has no heading starting `## [X.Y.Z]` for the version in `package.json`. Both the hand-written heading and release-please's linked heading satisfy that check.
- Entries describe the consumer-visible change and name the public symbol, in the voice of the existing entries.

### Bumped but not published (REL-04)

If a version number is written to `package.json` and the changelog but the package is never published, the changelog **records it as unreleased** rather than letting the number disappear. Mark the heading, for example `## [9.8.0] - 2026-09-10 (not published)`, and fold its entries into the next published version's notes by reference.

The reverse also applies. If versions were published without a changelog entry, backfill the entry once from the tag's commit range (`git log vA..vB --oneline`) so a reader can see every number that exists on npm.

The current changelog does not yet meet this rule; see [Known state](#known-state).

---

## What gates a publish (REL-02)

`validate-release` runs on Node 22 against the tagged commit. Every step blocks the publish.

| Step                        | Command                                                                                                                     | Blocks |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------- | :----: |
| Tag matches version         | `package.json` version equals the tag, then `npm run validate:versions`                                                     |   ●    |
| Lint                        | `npm run lint`                                                                                                              |   ●    |
| Formatting                  | `npm run format:check`                                                                                                      |   ●    |
| Dead code                   | `npx knip`                                                                                                                  |   ●    |
| Dependency audit            | `npm run audit:check` (allowlist with expiry, see SECURITY.md)                                                              |   ●    |
| Changelog entry for version | `grep "## [X.Y.Z]" CHANGELOG.md`                                                                                            |   ●    |
| Build                       | `npm run build`                                                                                                             |   ●    |
| Schema drift                | `npm run schema:drift:ci`                                                                                                   |   ●    |
| Generated types fresh       | `npm run generate:types`, then `git diff --exit-code` on `src/types/generated/` and `src/core/endpoints/esi-*.generated.ts` |   ●    |
| Generated operations fresh  | `npm run spec:generate:check`                                                                                               |   ●    |
| Auth/scope alignment        | `npm run validate:auth-scopes` (DES-04, both directions)                                                                    |   ●    |
| Endpoint definitions        | `npm run validate:esi` (ARCH-02)                                                                                            |   ●    |
| EARS spec audit             | `npm run spec:audit`, then `npm run validate:spec-consistency`                                                              |   ●    |
| Test suite                  | `npm run test:all` (unit + BDD, BDD, integration, fuzz, tsd)                                                                |   ●    |
| Recorded payload replay     | `npm run contract:replay`                                                                                                   |   ●    |
| Fault catalogue             | `npm run faults -- --ci`                                                                                                    |   ●    |
| Live contract tests         | `npm run contract:live`; a 503 from ESI is a warning, as on pull requests                                                   |   ●    |
| API reference builds        | `npm run docs`                                                                                                              |   ●    |

The shrink-only ratchets in `spec:audit`, `contract:replay` and the fault catalogue compare with the previous release tag (`SPEC_AUDIT_BASE_REF`, `CONTRACT_BASE_REF` and `FAULTS_BASE_REF` set to `git describe --tags --abbrev=0 HEAD^`, on a checkout with full history and tags), so an exception added since the last release fails the release, and a master that has since shrunk a list cannot block releasing an earlier commit. With no earlier tag the job fails rather than falling back to `origin/master`. Schema drift still uses the tag itself as its base. Not in the release gate, although they gate pull requests: the API surface diff and the SemVer gate, which need a base branch, and the consumer contract, which `release.yml` runs as its own job on the packed tarball.

Run the same checks locally before tagging:

```bash
npm run check:all      # lint, format, build, coverage, knip, validate:esi, validate:spec, validate:versions, spec:audit
npm run audit:check
npm run schema:drift:ci
npm run test:all
```

---

### One tarball, everywhere

`create-assets` runs `npm pack` once. That tarball is what the consumer matrix installs, what cosign signs, what goes on the GitHub Release, and — since `esi-23g.42` — what both `publish-npm` and `publish-github` upload, rather than each rebuilding from a fresh checkout.

Both publish jobs re-verify `checksums.txt` before uploading. If the bytes changed between packing and publishing, the artefact cosign signed and the artefact npm serves are already different, and the run stops rather than shipping the discrepancy.

That is what makes the canary's `signatures` check meaningful: the provenance attestation, the cosign bundle and the npm tarball all describe the same bytes.

## What is published where

| Destination                            | Artefact                                                                                                    | Integrity                                                                                                                                                              |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| npm registry (`registry.npmjs.org`)    | `@lgriffin/esi.ts` tarball, `dist/` + README, LICENSE, CHANGELOG                                            | npm provenance (SLSA v1 attestation)                                                                                                                                   |
| GitHub Packages (`npm.pkg.github.com`) | Same package                                                                                                | Published with `--provenance`                                                                                                                                          |
| GitHub release assets                  | `lgriffin-esi.ts-X.Y.Z.tgz`, `lgriffin-esi.ts-X.Y.Z.cdx.json` (SBOM), `docs.tar.gz`, `README.md`, `LICENSE` | `checksums.txt` (SHA-256); a `.sigstore.json` bundle per archive and SBOM from keyless cosign; `lgriffin-esi.ts-X.Y.Z.intoto.jsonl`, the SLSA provenance for all three |
| GitHub Pages                           | The documentation site, with the TypeDoc API reference under `/api/`                                        | —                                                                                                                                                                      |

The published file list is the `files` field in `package.json`. `publishConfig.access` is `public`.

### The post-publish canary (tier P)

Everything above the publish step checks what CI built. `post-publish-canary.yml` checks what the registry serves, which is not always the same artefact: `publish-npm` uploads the tarball the consumer matrix tested, but the registry can still serve something else, and a broken `exports` map is invisible until somebody installs it.

`release.yml` dispatches it once `publish-npm` has succeeded and the assets job has finished. It installs the version into an empty directory with nothing from this repository on disk, and establishes four things:

| Check        | What it proves                                                                        |
| :----------- | :------------------------------------------------------------------------------------ |
| `registry`   | npm serves that exact version, and its tarball resolves                               |
| `signatures` | `npm audit signatures` verifies the registry signature and the provenance attestation |
| `subpaths`   | every documented sub-path loads under both `require` and `import`                     |
| `live`       | one real call to public ESI returns data                                              |

A check that did not report, or was skipped, counts as a failure — "we did not look" must not read the same as "we looked and it was fine". A failure opens one issue per version, labelled `release-verification`, and re-running comments on it rather than opening another.

Run it by hand against any published version:

```bash
npm run release:canary -- --version 10.0.0          # from a checkout
gh workflow run post-publish-canary.yml -f version=10.0.0
```

Its own signal is a version that predates a sub-path. `9.0.0` has no `./sde`, so the canary fails on it with `ERR_PACKAGE_PATH_NOT_EXPORTED`, which is the shape a broken `exports` map takes; `10.0.0` verifies all four checks. That is the fire drill the plan asked for, without publishing a deliberately broken pre-release.

### If the canary fails: deprecate and fix forward

A published version cannot be replaced or re-uploaded. npm allows `unpublish` only within 72 hours and only when nothing depends on it, and using it breaks anyone who already installed. So:

1. **Deprecate it,** naming the problem and the version to use instead. The version stays installable for anyone already pinned to it, and everybody else gets a warning on install:

   ```bash
   npm deprecate '@lgriffin/esi.ts@X.Y.Z' 'Broken exports map; use X.Y.Z+1'
   ```

2. **Fix forward.** A patch release, or a major if the fix changes the public contract — the fact that the broken version shipped does not change how `guides/SEMVER.md` classifies the fix.

3. **Re-run the canary** against the new version and close the `release-verification` issue with the passing run linked.

4. **Write down what the gates missed** as an issue against the runway epic. A canary failure means every tier before it passed on something consumers could not use, and that gap is the more useful finding.

---

### Verifying a release

**npm provenance.** In a project that depends on the package:

```bash
npm audit signatures
npm view @lgriffin/esi.ts@X.Y.Z dist.attestations
```

The attestation links the tarball to the `release.yml` run and commit that built it.

**Checksums.** Download the assets from the GitHub release, then:

```bash
sha256sum -c checksums.txt
```

**cosign signatures.** Signing is keyless, so the identity to check is the workflow, not a key:

```bash
cosign verify-blob lgriffin-esi.ts-X.Y.Z.tgz \
  --bundle lgriffin-esi.ts-X.Y.Z.tgz.sigstore.json \
  --certificate-identity "https://github.com/lgriffin/ESI.ts/.github/workflows/release.yml@refs/tags/vX.Y.Z" \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

Releases from 10.0.0 on carry a Sigstore bundle (`.sigstore.json`) per asset. Earlier releases carried a separate `.sig` and `.pem`, verified with `--signature` and `--certificate` instead of `--bundle`.

Repeat with `docs.tar.gz` for the documentation archive.

**Build provenance.** From the first release after this change, each release carries `lgriffin-esi.ts-X.Y.Z.intoto.jsonl`: one SLSA provenance attestation naming the tarball, the SBOM and `docs.tar.gz` by SHA-256, signed through Sigstore by `release.yml` and also recorded on the repository. With the GitHub CLI, either form verifies:

```bash
gh attestation verify lgriffin-esi.ts-X.Y.Z.tgz --repo lgriffin/ESI.ts
gh attestation verify lgriffin-esi.ts-X.Y.Z.tgz --repo lgriffin/ESI.ts \
  --bundle lgriffin-esi.ts-X.Y.Z.intoto.jsonl \
  --signer-workflow lgriffin/ESI.ts/.github/workflows/release.yml
```

`sign-and-publish-assets` runs the second command on all three assets before it uploads anything, so a release never carries a provenance file that does not verify. The file is also what OpenSSF Scorecard's Signed-Releases check looks for.

**SBOM (SEC-06).** From the first release after this change, each release carries `lgriffin-esi.ts-X.Y.Z.cdx.json`, a CycloneDX 1.5 JSON bill of materials for that tarball, listed in `checksums.txt` and signed like the tarball:

```bash
cosign verify-blob lgriffin-esi.ts-X.Y.Z.cdx.json \
  --bundle lgriffin-esi.ts-X.Y.Z.cdx.json.sigstore.json \
  --certificate-identity "https://github.com/lgriffin/ESI.ts/.github/workflows/release.yml@refs/tags/vX.Y.Z" \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com

jq -r '.metadata.component.purl, (.components[] | "\(.name)@\(.version)")' lgriffin-esi.ts-X.Y.Z.cdx.json
```

What it describes: the runtime dependency tree of the tarball's own `package.json` (`dependencies` and everything they pull in), at the versions in this repository's `package-lock.json` — the ones the release was tested with. A consumer's install resolves the same ranges and can pick newer patches, so the SBOM states what was shipped and tested, not what every install will contain. Dev dependencies are not in it, and neither are the optional peers (`better-sqlite3`, `js-yaml`, `adm-zip`), which a default install does not fetch. The build bundles no third-party package, so the dependency tree is the whole inventory.

`npm run release:sbom -- --tarball <file>` generates it. `scripts/release/release-sbom-core.ts` fails the release if the document is not CycloneDX, does not name `@lgriffin/esi.ts` at the tagged version with its purl, or leaves out a runtime dependency, and explains why it does not use `npm sbom --omit dev` on the checkout (that drops `zod` and part of pino's tree, because dev tools share them). `tests/tdd/release-sbom/` runs the generator against the repository on every `npm test`.

---

## Version strings (REL-03)

| Location                                                            | Written by                         | Checked by                            |
| ------------------------------------------------------------------- | ---------------------------------- | ------------------------------------- |
| `package.json`                                                      | release-please                     | `npm run validate:versions`           |
| `package-lock.json`                                                 | release-please (node release type) | `npm ci` in CI                        |
| `.release-please-manifest.json`                                     | release-please                     | —                                     |
| `src/core/constants.ts` (`PACKAGE_VERSION`, sent in the User-Agent) | release-please `extra-files`       | `npm run validate:versions`           |
| README banner                                                       | by hand                            | nothing                               |
| docs-site version menu                                              | read from `package.json` at build  | `npm run validate:versions -- --site` |

`scripts/package/validate-versions.ts` compares `package.json` with `PACKAGE_VERSION`, checks that the docs-site selector is still read from `package.json`, and with `--site` checks the built site; it exits non-zero on a mismatch. It runs in `ci.yml` `static-analysis`, `release.yml` `validate-release` and `npm run check:all`, and with `--site` in the `documentation` job and `docs-site.yml`. The README banner is still by hand; `DOC-04` extends the check to it.

---

## Support window

The supported major versions are listed once, in the root [SECURITY.md](../SECURITY.md). Update that table in the same pull request as a major release.

The package declares `"engines": { "node": ">=22.12.0" }` (REL-05) and supports TypeScript 5.4 or later for consumers (`OLDEST_TYPESCRIPT` in `scripts/quality/consumer-contract-core.ts`; zod 4's declarations need `NoInfer`, added in 5.4). The consumer contract checks both floors on every pull request and release: its oldest-TypeScript row runs on Node 22.12 exactly, since a bare `22` would install the newest 22.x. Pull requests run unit tests on Node 22 and 24. Release jobs and the rest of CI run on Node 22, which is also the version in `.nvmrc`. Node 22 is the floor from 11.0.0 because Node 18 and 20 are end of life, and 22.12 within it because it is the first 22.x to load an ES module through `require()` without a flag; 10.x is the line for Node 18 and 20.

---

## Known state

Recorded 2026-09-16. Each item contradicts a requirement above and belongs in a bead, not a softened sentence.

- **npm publishing still uses a long-lived token.** Both publish jobs now upload the tarball `create-assets` packed and cosign signed (`esi-23g.42`), so the registries and the GitHub Release carry the same bytes. `publish-npm` still authenticates with the `NPM_TOKEN` secret; moving it to npm trusted publishing needs the maintainer to configure the trusted publisher on npmjs.com first ([SECURITY.md](SECURITY.md#5-settings-only-the-maintainer-can-change), ROADMAP Phase 6 item 3).
- **Recent GitHub releases are missing their signed assets.** v10.2.0 carries the tarball, SBOM, docs archive, their cosign bundles and `checksums.txt`; v10.2.2 and v10.2.3 carry no assets at all (checked 2026-09-27), so `sign-and-publish-assets` did not run or did not finish for them. OpenSSF Scorecard's Signed-Releases check reads the last five releases, so it stays low until the releases in that window are signed; no release before this change has a `.intoto.jsonl`.
- **release-please needed repository permission to open its pull request.** It computed the version but failed with "GitHub Actions is not permitted to create or approve pull requests" until that repository setting was enabled (2026-09-16). Releases 9.8.0 and 9.9.0 were hand-written `chore: release X.Y.Z` commits.
- **Releases created with the workflow's `GITHUB_TOKEN` do not trigger other workflows.** 10.1.0 and 10.1.1 were tagged and released on GitHub but never published to npm, because nothing dispatched `release.yml`. `release-please.yml` now uses the [release app token](#the-release-app-token) when it is configured, and dispatches `release.yml` and the canary itself when it is not.
- **v9.7.0 has no signed assets.** Its `sign-and-publish-assets` job failed because cosign 3 requires `--bundle` for `sign-blob`; the job now writes a Sigstore bundle per asset. npm and GitHub Packages publishing succeeded for that release.
- **The changelog does not match the registry (REL-04).** npm has 8.0.0, 9.4.0 and 9.6.0 with no changelog entry; the changelog jumps from 7.4.0 to 9.0.0 and from 9.1.0 to 9.7.0. 9.8.0 and 9.9.0 have dated entries but no tag and no npm publish.
