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
2. **release-please runs on every push to `master`.** It reads the commits since the last release, works out the next version, and opens or updates a release pull request. That pull request edits `package.json`, `.release-please-manifest.json`, `CHANGELOG.md` and the extra file `src/core/constants.ts`.
3. **Merging the release pull request** makes release-please create the `vX.Y.Z` tag and the GitHub release.
4. **`release.yml` runs twice**, once for the tag push (`v*.*.*`) and once for the `release: published` event. Both runs validate, build the documentation and build the assets. Only the `release` run, or a manual `workflow_dispatch` run on the tag, publishes packages and signs assets; those jobs are guarded by the event name.

### Jobs in `release.yml`

| Job                       | Needs                                   | Runs on                   | Does                                                                                                                                                                      |
| ------------------------- | --------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validate-release`        | —                                       | tag push and release      | The publish gate, below                                                                                                                                                   |
| `publish-npm`             | `validate-release`, `consumer-contract` | release only              | `npm ci`, `npm run build`, `npm publish --provenance` to `registry.npmjs.org`                                                                                             |
| `publish-github`          | `validate-release`, `consumer-contract` | release only              | Same build, `npm publish --provenance` to `npm.pkg.github.com`                                                                                                            |
| `deploy-docs`             | `validate-release`                      | tag push and release      | `npm run docs`, then deploys `docs-site/public/api` (TypeDoc) to GitHub Pages                                                                                             |
| `create-assets`           | `validate-release`                      | tag push and release      | `npm pack` (fails unless exactly one tarball), `docs.tar.gz` of the API reference, `checksums.txt` (SHA-256); uploads as artifact                                         |
| `consumer-contract`       | `create-assets`                         | tag push and release      | The consumer contract (`npm run test:consumer -- --tarball`) against the tarball `create-assets` packed: Node 18, 20, 22 and 24, oldest, repository and latest TypeScript |
| `sign-and-publish-assets` | `create-assets`, `consumer-contract`    | release only              | Keyless `cosign sign-blob` on the tarball and docs archive, then `gh release upload` of all assets plus `README.md` and `LICENSE`                                         |
| `notify-success`          | all of the above                        | when `publish-npm` passed | Log line only                                                                                                                                                             |

The workflow holds top-level `contents: read`. Only `publish-npm`, `publish-github` and `sign-and-publish-assets` receive `id-token: write`, and signing sits in its own job so that no build step shares a job with the ability to mint an OIDC token.

`release.yml` also has a `workflow_dispatch` trigger, for releases release-please creates with `GITHUB_TOKEN` (see [Known state](#known-state)). Dispatch it on the tag, `gh workflow run release.yml --ref vX.Y.Z`; `validate-release` fails on any other ref, and on a tag that does not match `package.json`. `release-please.yml` has no manual trigger.

---

## Version bumps

release-please uses the `node` release type with `bump-minor-pre-major: false`, so semantic-versioning rules apply as written. Deciding which bump a change needs, and how to mark it, is in [SEMVER.md](SEMVER.md).

| Commit                                                       | Bump  | Changelog section |
| ------------------------------------------------------------ | ----- | ----------------- |
| `type!:` or a `BREAKING CHANGE:` footer, any type            | major | as for the type   |
| `feat:`                                                      | minor | Added             |
| `fix:`                                                       | patch | Fixed             |
| `perf:`, `refactor:`, `chore:`                               | patch | Changed           |
| `docs:`                                                      | patch | Documentation     |
| `test:`                                                      | patch | Testing           |
| `build:`, `ci:`, `style:`, `revert:` (allowed by commitlint) | none  | not listed        |

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

`validate-release` runs on Node 20 against the tagged commit. Every step blocks the publish except dead-code detection.

| Step                        | Command                                                                                                           | Blocks |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- | :----: |
| Lint                        | `npm run lint`                                                                                                    |   ●    |
| Formatting                  | `npm run format:check`                                                                                            |   ●    |
| Dead code                   | `npx knip --no-exit-code`                                                                                         |   ◐    |
| Dependency audit            | `npm run audit:check` (allowlist with expiry, see SECURITY.md)                                                    |   ●    |
| Changelog entry for version | `grep "## [X.Y.Z]" CHANGELOG.md`                                                                                  |   ●    |
| Build                       | `npm run build`                                                                                                   |   ●    |
| Schema drift                | `npm run schema:drift:ci`                                                                                         |   ●    |
| Generated types fresh       | `npm run generate:types`, then `git diff --exit-code` on `src/types/generated/` and `esi-cache-ttls.generated.ts` |   ●    |
| Test suite                  | `npm run test:all` (unit + BDD, BDD, integration, fuzz, tsd)                                                      |   ●    |
| API reference builds        | `npm run docs`                                                                                                    |   ●    |

Not in the release gate today, although they gate pull requests: contract tests, `spec:audit`, `validate:auth-scopes`, `validate:versions` and the API surface diff. A release built from a merged pull request has already passed them. A tag pushed on any other commit has not.

Run the same checks locally before tagging:

```bash
npm run check:all      # lint, format, build, coverage, knip, validate:esi, validate:spec, validate:versions, spec:audit
npm run audit:check
npm run schema:drift:ci
npm run test:all
```

---

## What is published where

| Destination                            | Artefact                                                           | Integrity                                                                  |
| -------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| npm registry (`registry.npmjs.org`)    | `@lgriffin/esi.ts` tarball, `dist/` + README, LICENSE, CHANGELOG   | npm provenance (SLSA v1 attestation)                                       |
| GitHub Packages (`npm.pkg.github.com`) | Same package                                                       | Published with `--provenance`                                              |
| GitHub release assets                  | `lgriffin-esi.ts-X.Y.Z.tgz`, `docs.tar.gz`, `README.md`, `LICENSE` | `checksums.txt` (SHA-256); `.sig` + `.pem` per archive from keyless cosign |
| GitHub Pages                           | TypeDoc API reference from `docs-site/public/api`                  | —                                                                          |

The published file list is the `files` field in `package.json`. `publishConfig.access` is `public`.

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

---

## Version strings (REL-03)

| Location                                                            | Written by                         | Checked by                  |
| ------------------------------------------------------------------- | ---------------------------------- | --------------------------- |
| `package.json`                                                      | release-please                     | `npm run validate:versions` |
| `package-lock.json`                                                 | release-please (node release type) | `npm ci` in CI              |
| `.release-please-manifest.json`                                     | release-please                     | —                           |
| `src/core/constants.ts` (`PACKAGE_VERSION`, sent in the User-Agent) | release-please `extra-files`       | `npm run validate:versions` |
| README banner                                                       | by hand                            | nothing                     |
| docs-site version menu                                              | by hand                            | nothing                     |

`scripts/validate-versions.ts` compares `package.json` with `PACKAGE_VERSION` and exits non-zero on a mismatch. It runs in `npm run check:all`, not in CI. The charter's direction is to extend it to the README and site, or to remove those banners.

---

## Support window

The supported major versions are listed once, in the root [SECURITY.md](../SECURITY.md). Update that table in the same pull request as a major release.

The package declares `"engines": { "node": ">=18.0.0" }` (REL-05) and supports TypeScript 5.4 or later for consumers (`OLDEST_TYPESCRIPT` in `scripts/consumer-contract-core.ts`; zod 4's declarations need `NoInfer`, added in 5.4). The consumer contract checks both floors on every pull request and release. Pull requests run unit tests on Node 18, 20 and 22. Release jobs and the rest of CI run on Node 20, which is also the version in `.nvmrc`. Node 18 is the floor because the transport uses the global `fetch`.

---

## Known state

Recorded 2026-09-16. Each item contradicts a requirement above and belongs in a bead, not a softened sentence.

- **npm and GitHub Packages publish a fresh build, not the tested tarball.** `consumer-contract` runs against the tarball `create-assets` packs, which is the one signed and attached to the release. `publish-npm` and `publish-github` wait for it but run `npm run build` and `npm publish` themselves, so the registries receive a rebuild of the same commit. Publishing `release-artifacts/<tarball>` with `npm publish <file> --provenance` would make all three the same bytes; that changes the credentialed jobs, so it is a separate change.
- **release-please needed repository permission to open its pull request.** It computed the version but failed with "GitHub Actions is not permitted to create or approve pull requests" until that repository setting was enabled (2026-09-16). Releases 9.8.0 and 9.9.0 were hand-written `chore: release X.Y.Z` commits.
- **Releases created with the workflow's `GITHUB_TOKEN` do not trigger other workflows.** When release-please creates the tag and release, `release.yml` does not start on its own. Publish by dispatching it on the tag: `gh workflow run release.yml --ref vX.Y.Z`. The first `validate-release` steps reject a run that is not on a `vX.Y.Z` tag or whose tag does not match `package.json` and `PACKAGE_VERSION`.
- **v9.7.0 has no signed assets.** Its `sign-and-publish-assets` job failed because cosign 3 requires `--bundle` for `sign-blob`; the job now writes a Sigstore bundle per asset. npm and GitHub Packages publishing succeeded for that release.
- **The changelog does not match the registry (REL-04).** npm has 8.0.0, 9.4.0 and 9.6.0 with no changelog entry; the changelog jumps from 7.4.0 to 9.0.0 and from 9.1.0 to 9.7.0. 9.8.0 and 9.9.0 have dated entries but no tag and no npm publish.
- **SBOM** is not yet a release asset (SEC-06); see [SECURITY.md](SECURITY.md).
