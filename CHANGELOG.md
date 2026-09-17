# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [10.0.0](https://github.com/lgriffin/ESI.ts/compare/v9.9.0...v10.0.0) (2026-09-17)


### ⚠ BREAKING CHANGES

* **schemas:** four response fields are now required, a runtime tightening.
    - CharacterFleetInfo.fleet_boss_id, CustomsOffice.allow_alliance_access,
      CustomsOffice.allow_access_with_standings and SolarSystemInfo.position no
      longer include `undefined` in their types, and a body without one throws
      EsiValidationError. ESI always sends them, so live responses are
      unaffected; test doubles that stub GET /characters/{id}/fleet,
      GET /corporations/{id}/customs_offices or GET /universe/systems/{id}
      must include them. `?? fallback` guards on these reads can be removed.
* **schemas:** these response fields widen to `T | undefined`, so code that reads them may stop compiling under strict null checks; guard the reads (`?.`, `??` or an explicit check). Bodies without them no longer throw.
    - CalendarEvent: event_id, event_date, title, importance, event_response.
    - CalendarEventAttendee: character_id, event_response.
    - CharacterTitle: title_id, name.
    - CloneInfo.home_location: location_id, location_type.
    - DogmaAttribute.name, DogmaEffect.name.
    - BulkIdResult (postBulkNamesToIds): id and name of each entry in agents,
      alliances, characters, constellations, corporations, factions,
      inventory_types, regions, systems and stations.
* **wallet:** corporation wallet transactions have their own type. getCorporationWalletTransactions, fetchAllCorporationWalletTransactions and streamCorporationWalletTransactions return CorporationWalletTransaction instead of WalletTransaction; it has no is_personal, which ESI never sent on this route. Remove reads of is_personal on corporation trades and retype `WalletTransaction[]` annotations on these calls. New exports: CorporationWalletTransaction, CorporationWalletTransactionSchema, and TestDataFactory.createCorporationWalletTransaction in @lgriffin/esi.ts/testing.
* **meta:** MetaStatus is { routes: MetaRouteStatus[] } instead of { status: string }. meta.getStatus() used to throw on every real response, so no working code read `status`; read `routes` and filter by `route.status !== 'OK'` to find degraded routes. New exports: MetaRouteStatus, MetaRouteStatusSchema. (Server status from client.status.getStatus() is unchanged.)
* **mail:** mail headers and messages have separate types.
    - getMailHeaders, fetchAllMailHeaders and streamMailHeaders return
      MailHeader (new) instead of MailMessage. MailHeader has the same fields
      minus body, which ESI never sent in headers.
    - MailMessage (getMail) no longer has mail_id or is_read, which ESI never
      sent on this route; read the new `read` flag instead of is_read, and use
      the mailId you passed in.
    - MailLabel.label_id and MailLabel.name are `| undefined`; guard reads.
    New exports: MailHeader, MailHeaderSchema.
* **industry:** corporation industry jobs have their own type. getCorporationIndustryJobs, fetchAllCorporationIndustryJobs and streamCorporationIndustryJobs return CorporationIndustryJob instead of IndustryJob. It has location_id (number) and no station_id; ESI never sent station_id on this route, so code reading it got undefined and should read location_id. Retype `IndustryJob[]` annotations on these calls to `CorporationIndustryJob[]`. New exports: CorporationIndustryJob, CorporationIndustryJobSchema, and TestDataFactory.createCorporationIndustryJob in @lgriffin/esi.ts/testing.
* **corporation:** corporation response types now match ESI.
    - CorporationMedal.date is renamed created_at.
    - CorporationIssuedMedal no longer has title or description; join on
      medal_id to getCorporationMedals for them.
    - CorporationRoleHistory.before and .after are renamed old_roles and
      new_roles.
    - CorporationStarbaseDetail no longer has state (read it from
      getCorporationStarbases). Its eleven access and defence settings listed
      above are required: types drop `| undefined`, and a body without one
      throws EsiValidationError.
    - CorporationStarbase.state, CorporationTitle.title_id, the division number
      in CorporationDivisions.hangar[] and .wallet[], and
      CorporationMemberTracking.start_date are now `| undefined`; guard reads
      of them.
* **freelance-jobs:** freelance job participation, participants, detail and cursor types now match ESI.
    - FreelanceJobParticipation is { state, contributed, last_modified }
      instead of { job_id, character_id, status, contributions,
      last_contribution? }. Read state (e.g. 'Committed') for status,
      contributed for contributions and last_modified for last_contribution;
      the job and character IDs are the ones you passed in.
    - getCorporationFreelanceJobParticipants returns
      FreelanceJobParticipantsListing ({ participants, cursor? }) instead of
      FreelanceJobParticipant[]. Read listing.participants.
      FreelanceJobParticipant is { id, name, state, contributed }: character_id
      -> id, status -> state, contributions -> contributed; corporation_id and
      last_contribution are gone.
    - EsiCursor.before and EsiCursor.after are string | undefined, not
      string | null, on every freelance listing. Replace `=== null` checks with
      a falsy or `=== undefined` check; a body with a null token now throws
      EsiValidationError.
    - FreelanceJobDetail.contribution, details.expires and
      access_and_visibility.broadcast_locations may be undefined; guard reads
      (e.g. `detail.contribution?.max_committed_participants`). New optional
      details.finished, contribution.contribution_per_participant_limit,
      contribution.submission_limit and access_and_visibility.restrictions.
    New exports: FreelanceJobParticipantsListing,
    FreelanceJobParticipantsListingSchema.
* **contracts:** public contract bids and items have their own types, and three contract fields are required.
    - getPublicContractBids returns PublicContractBid[] ({ bid_id, date_bid,
      amount }) instead of ContractBid[]. There is no bidder_id: ESI never sent
      one here, so code reading it got undefined. Retype annotations from
      ContractBid to PublicContractBid.
    - getPublicContractItems returns PublicContractItem[] instead of
      ContractItem[]: no is_singleton or raw_quantity; new optional item_id,
      is_blueprint_copy, material_efficiency, time_efficiency and runs.
    - Contract.assignee_id, Contract.acceptor_id (number) and
      Contract.for_corporation (boolean) are no longer `| undefined`; a
      character or corporation contract body without them throws
      EsiValidationError. Test doubles must include all three (0 for an unset
      assignee or acceptor).
    - ContractItem (character and corporation items) no longer declares
      is_blueprint_copy; read it from PublicContractItem, where ESI sends it.
    New exports: PublicContractBid, PublicContractItem, PublicContractBidSchema,
    PublicContractItemSchema.
* **testing:** default payloads from @lgriffin/esi.ts/testing changed.
    - createAllianceInfo(), createCorporationInfo(), createStar() and
      createStructure() no longer set alliance_id, corporation_id, star_id or
      structure_id. Pass the ID as an override if your test reads it from the
      payload.
    - createItemType() no longer sets category_id. Read the category from
      createItemGroup(), or pass { category_id } as an override.
    - createSearchResults() returns { solar_system, station, structure,
      character, corporation, alliance } instead of { systems, stations,
      structures, characters, corporations, alliances }. Rename the keys you read
      or override (e.g. { solar_system: [30000142] }).
    - createSolarSystem() adds position and createContract() adds
      acceptor_id: 0. Tests comparing a builder's whole output with toEqual must
      expect the new fields.
* **testing:** default payloads from @lgriffin/esi.ts/testing changed.
    - createCharacterInfo() no longer sets character_id. Pass
      { character_id } as an override if your test reads it.
    - createFleetInfo() no longer sets fleet_id or fleet_boss_id; pass them
      as overrides if needed (GET /characters/{id}/fleet is where ESI sends
      them).
    - createFleetWing() returns { id, name, squads: [{ id, name }] }; read
      wing.id and squad.id instead of wing_id and squad_id, and override `id`
      instead of `wing_id`.
    - createFleetMember() adds wing_id: -1, squad_id: -1,
      role_name: 'Fleet Commander (Boss)', join_time and takes_fleet_warp;
      override them for a squad member.
    - createIndustryJob(), createCharacterAsset(), createCorporationAsset(),
      createCharacterMedal(), createCorporationStructure() and createStation()
      add the fields listed above. Tests comparing a builder's whole output
      with toEqual must expect the new fields.
* **schemas:** three response fields are now required and public contracts have their own type.
    - ServerStatus.vip is `boolean`, not `boolean | undefined`, and a status
      body without vip now throws EsiValidationError. Drop `?? false`
      fallbacks if you like; test doubles that stub /status must include vip.
    - Contract.status and Contract.availability (character and corporation
      contracts) are required; bodies without them throw EsiValidationError.
      Test doubles must include both.
    - getPublicContracts, fetchAllPublicContracts and streamPublicContracts
      return PublicContract (new, with PublicContractSchema) instead of
      Contract. PublicContract has no status, availability, assignee_id,
      acceptor_id, date_accepted or date_completed, which ESI never sent for
      public contracts; code reading them got undefined and can remove those
      reads. Annotations of `Contract[]` on these calls become
      `PublicContract[]`.
* **factions:** faction warfare leaderboard types changed.
    - getLeaderboardsOverall() returns FactionWarfareFactionLeaderboard,
      getLeaderboardsCharacters() FactionWarfareCharacterLeaderboard and
      getLeaderboardsCorporations() FactionWarfareCorporationLeaderboard,
      instead of FactionWarfareLeaderboard for all three.
    - Entry `id` is gone: read `faction_id`, `character_id` or
      `corporation_id` for the board you called.
    - Entry `amount` is now `number | undefined`: default it
      (`entry.amount ?? 0`) or skip unscored entries.
    - FactionWarfareLeaderboard and FactionWarfareLeaderboardSchema are
      deprecated and no longer validate any endpoint; each new board type is
      assignable to FactionWarfareLeaderboard. Switch to the per-board type or
      schema (FactionWarfareFactionLeaderboardSchema,
      FactionWarfareCharacterLeaderboardSchema,
      FactionWarfareCorporationLeaderboardSchema).
* **corporation-projects:** corporation project types, schemas and methods now match ESI, and the old shapes are gone.
    - getCorporationProjects(corporationId, before?, after?) returns
      CorporationProjectsListing ({ projects: CorporationProjectSummary[],
      cursor?: { before?, after? } }) instead of CorporationProject[].
      Read listing.projects; pass listing.cursor?.after as `after` for the next
      page.
    - getCorporationProjectContributors(corporationId, projectId, before?,
      after?) returns CorporationProjectContributorsListing ({ contributors,
      cursor? }) instead of CorporationProjectContributor[]. Read
      listing.contributors.
    - projectId is a string (the project UUID) in getCorporationProject,
      getCorporationProjectContribution and getCorporationProjectContributors.
      Pass project.id from a listing.
    - CorporationProject / CorporationProjectSchema: project_id -> id (string),
      progress number -> { current, desired } (fraction = current / desired),
      start_time -> details.created, finish_time -> details.finished. New
      required fields name, last_modified, creator, details, configuration;
      optional reward and contribution. state is an esiEnum ('Active',
      'Completed', ...), capitalised as ESI sends it.
    - CorporationProjectContributor / Schema: character_id -> id,
      contribution -> contributed, plus name.
    - CorporationProjectContribution / Schema: { character_id, contribution }
      -> { contributed, last_modified? }; the character ID is the one you
      passed in.
    New exports: CorporationProjectsListing, CorporationProjectSummary,
    CorporationProjectContributorsListing, CorporationProjectCursor and their
    schemas.

### Added

* **auth:** add EsiTokenManager with pluggable storage and bulk refresh ([1b6ca0a](https://github.com/lgriffin/ESI.ts/commit/1b6ca0a1bb7c460e74b26ee753660f1ee20342b0))
* **auth:** add EsiTokenManager with pluggable storage and bulk refresh ([91de317](https://github.com/lgriffin/ESI.ts/commit/91de317460b229547eb6fcbc78edd31582e6448d)), closes [#185](https://github.com/lgriffin/ESI.ts/issues/185) [#187](https://github.com/lgriffin/ESI.ts/issues/187)
* **logging:** per-client structured logging, engineering charter, release 9.9.0 ([ca9773b](https://github.com/lgriffin/ESI.ts/commit/ca9773bc9106741f9400690e4a14dbc6d39168fa))
* ramp-up phases 1, 3, 4 and 5 — load-bearing spec, CI gate, agent governance ([8453187](https://github.com/lgriffin/ESI.ts/commit/8453187e836dedcefc1d686a8371e19835c97bd2))
* **skills:** gate ears-gherkin-dev changes with an eval suite ([18865c8](https://github.com/lgriffin/ESI.ts/commit/18865c8848cde16b7243f3f17b60b270a98f3cca))
* **spec-consistency:** check Rule titles against response schemas ([eb4ed10](https://github.com/lgriffin/ESI.ts/commit/eb4ed105c28e33814cffb8bcdae9689cd6b74f6c))


### Fixed

* **auth:** address review findings on SSO exchange, refresh races and storage ([e8172f1](https://github.com/lgriffin/ESI.ts/commit/e8172f1efd781040bffc0a29ecca683fd61aeba6))
* **build:** let release-please bump PACKAGE_VERSION ([8ef9c19](https://github.com/lgriffin/ESI.ts/commit/8ef9c1994671891a67be438c5efd0cc2b4f5ffba))
* **build:** share one copy of each class across sub-path entries ([8110d73](https://github.com/lgriffin/ESI.ts/commit/8110d73cfd7016aebfe9bed5a85aed84fc12dec7))
* **build:** share one copy of each class across sub-path entries ([2f0ec0a](https://github.com/lgriffin/ESI.ts/commit/2f0ec0aa73051615a2bad3ed3a42c0e952c98d97))
* **cache:** evict a response body that fails schema validation ([22b0d0b](https://github.com/lgriffin/ESI.ts/commit/22b0d0b31276bf6526d52eb9ad3c7db43d3b8d7e))
* **cache:** evict cached reads after writes answered with 201 or 204 ([7e41381](https://github.com/lgriffin/ESI.ts/commit/7e413819ceaa591d961c254124fb4b4f25d16288))
* **cache:** keep entries an hour past their freshness TTL for stale-on-error ([e4f7e9a](https://github.com/lgriffin/ESI.ts/commit/e4f7e9a9dfe09afc7aead67d7810fd677de9bc47))
* **cache:** keep entries an hour past their freshness TTL for stale-on-error ([fec657d](https://github.com/lgriffin/ESI.ts/commit/fec657d28b4806a1ba6bddd04a722065bd247523))
* **ci:** publish releases created by release-please and sign with cosign bundles ([befc639](https://github.com/lgriffin/ESI.ts/commit/befc6392f347dbd2f9c76c1fd76af96ccfd76083))
* **ci:** unblock the v10.0.0 release: drift baseline, version marker, dispatchable publish, cosign bundles ([5271515](https://github.com/lgriffin/ESI.ts/commit/527151572053fb07ff9690b603743e7a65806efd))
* **contracts:** give public bids and items their spec shape; require acceptor ([3ab3198](https://github.com/lgriffin/ESI.ts/commit/3ab31987abbd64acb578af92fc1dcaaf13ea9d0b))
* **corporation-projects:** match project schemas, types and methods to ESI ([afa7e8f](https://github.com/lgriffin/ESI.ts/commit/afa7e8ff37a24395beb591e7698da25a6cf1dee7))
* **corporation:** match medals, role history, starbases, titles and tracking to ESI ([16ee3d7](https://github.com/lgriffin/ESI.ts/commit/16ee3d7c3f0c96022abe3e861358e13526a3f739))
* **errors:** keep ESI's reason in the error message ([9ad8902](https://github.com/lgriffin/ESI.ts/commit/9ad8902ba5c67b45386a6f70a6edfa61ca17cad4))
* **errors:** surface network failures and timeouts as EsiError ([cd661a3](https://github.com/lgriffin/ESI.ts/commit/cd661a39a9dd46810ab8cbc8be96f67bb03d4158))
* **factions:** give each faction warfare leaderboard its spec entry shape ([b997d2c](https://github.com/lgriffin/ESI.ts/commit/b997d2cd4f86929dc9007615d7d604c435d522a7))
* **freelance-jobs:** match participation, participants, detail and cursor to ESI ([e49c3d1](https://github.com/lgriffin/ESI.ts/commit/e49c3d11cb400f0620d45821228543f25defab12))
* **industry:** place corporation industry jobs by location_id as ESI does ([8ebe25d](https://github.com/lgriffin/ESI.ts/commit/8ebe25d48270d62b5a860822eef1a024a216cc32))
* **mail:** split mail headers from the full message and type its read flag ([600472b](https://github.com/lgriffin/ESI.ts/commit/600472baeebc741a172460ab6cc03721a9327c6d))
* **meta:** give getStatus the per-route shape ESI sends ([7b72f40](https://github.com/lgriffin/ESI.ts/commit/7b72f40a44205d94a7b708e83f15795c5a00625c))
* **mutation:** satisfy noUncheckedIndexedAccess in the ratchet script ([07ae337](https://github.com/lgriffin/ESI.ts/commit/07ae337107001ec3cdff319edc35a0bc190c65c6))
* ramp-up phase 6 — library safety gates and a validation cache fix ([a2629ad](https://github.com/lgriffin/ESI.ts/commit/a2629ada8d7cb1b896211f6762f185ef46667359))
* **release:** tag releases vX.Y.Z and start the changelog at 9.9.0 ([2067882](https://github.com/lgriffin/ESI.ts/commit/2067882e9920e60d3e3b5bda3d373187671baa30))
* **release:** tag releases vX.Y.Z and start the changelog at 9.9.0 ([15e62d6](https://github.com/lgriffin/ESI.ts/commit/15e62d66a742325ef05b90aeb3c590fa1b2c661e))
* **schemas:** require fleet boss, customs office access flags and system position ([00fff7c](https://github.com/lgriffin/ESI.ts/commit/00fff7c06d946043e833833894f9f885093393c5))
* **schemas:** require vip, contract status and availability as ESI does ([24c8c35](https://github.com/lgriffin/ESI.ts/commit/24c8c35de56e92ceb821383808cc2359acfb6659))
* **schemas:** stop requiring fields the ESI spec marks optional ([fc8e489](https://github.com/lgriffin/ESI.ts/commit/fc8e489274a0b40700fd0f63818830a44db3bd60))
* **scripts:** drop drift baseline entries resolved by v10 part 2 ([1c54a30](https://github.com/lgriffin/ESI.ts/commit/1c54a3098d591c06479b3baee83c9efe23c3ea51))
* **scripts:** drop the 83 drift baseline entries [#317](https://github.com/lgriffin/ESI.ts/issues/317) resolved ([2cb7d18](https://github.com/lgriffin/ESI.ts/commit/2cb7d18779d70ecddff6b814715a50a2af5f7953))
* **scripts:** make schema:drift compare what it reports ([3dc4c53](https://github.com/lgriffin/ESI.ts/commit/3dc4c532d61fe100e842fda7d25f16093d19fe41))
* **scripts:** make schema:drift compare what it reports, with a ratcheted baseline ([7f428f9](https://github.com/lgriffin/ESI.ts/commit/7f428f926ca5b4e6ce43ef2dd626578409c1552c))
* **sde:** load js-yaml and adm-zip lazily as optional peer dependencies ([22afdce](https://github.com/lgriffin/ESI.ts/commit/22afdce1cabc9c6bbe860b14194222c3c9e39872))
* **sde:** load js-yaml and adm-zip lazily as optional peer dependencies ([526587b](https://github.com/lgriffin/ESI.ts/commit/526587beb77612daaf77e7c2da581fa21cf7ce69))
* **sde:** read nested _sde.yaml metadata from ZIP archives ([1f46860](https://github.com/lgriffin/ESI.ts/commit/1f46860834a6ab9f9e4320f9eee8259e1d2b8931))
* **sde:** read nested _sde.yaml metadata from ZIP archives ([13d04cb](https://github.com/lgriffin/ESI.ts/commit/13d04cbc3ce74b431f94688ad293163a97f29489))
* **spec-audit:** close five holes that let a non-compliant spec pass ([9106978](https://github.com/lgriffin/ESI.ts/commit/910697878270e34450af40431b90d9fa605b94b9))
* **spec-audit:** close five holes that let a non-compliant spec pass ([df06b64](https://github.com/lgriffin/ESI.ts/commit/df06b64cd1a116c885627240931fb734954e7b2f))
* **spec-audit:** load Cucumber through dynamic import so the audit runs on Node 18 ([4f0f819](https://github.com/lgriffin/ESI.ts/commit/4f0f819262aa7d7f0de70bbcdfbc4b143d3b2cde))
* **spec-audit:** split the pure checks out so Jest can load them ([34100d7](https://github.com/lgriffin/ESI.ts/commit/34100d77101bc1d2d4c5998b1cf70b69dbeeef9d))
* **spec-consistency:** run on shallow CI checkouts and on Node 18 ([98be8be](https://github.com/lgriffin/ESI.ts/commit/98be8bee5b2271a7086d4dbd8cb83792ef6ed9ed))
* **spec:** qualify Rule titles that promise optional response fields ([227ebbf](https://github.com/lgriffin/ESI.ts/commit/227ebbfd5f62de1f47b450d0a75db4fc3799da89))
* **spec:** reconcile domain failure Rules with retry and stale-on-error ([a2695dd](https://github.com/lgriffin/ESI.ts/commit/a2695ddb777ee53d3ef1f65b6cee105c61103646))
* **testing:** drop invented IDs and add required fields in TestDataFactory ([d59388c](https://github.com/lgriffin/ESI.ts/commit/d59388c15cbe8ffb9752b99a53cb31da538bbc1a))
* **testing:** make TestDataFactory builders emit schema-valid ESI payloads ([8d81bb8](https://github.com/lgriffin/ESI.ts/commit/8d81bb8af09e6cebfc25a2c74e558242861533b2))
* **wallet:** stop requiring is_personal on corporation wallet transactions ([c013e88](https://github.com/lgriffin/ESI.ts/commit/c013e88c9e0b7558a26757eb25c8e4d0c4ebdffe))


### Changed

* add CODEOWNERS covering bot-touched manifests, workflows and release config ([892bcbc](https://github.com/lgriffin/ESI.ts/commit/892bcbc4da005f116d3900f6171e57f6ee8f929a))
* **beads:** export the ramp-up phase notes and follow-up issues ([6fef0bc](https://github.com/lgriffin/ESI.ts/commit/6fef0bc7085256563afc29a135d30031c334c5d0))
* **ci:** bump github/codeql-action to 4.38.0 ([741000c](https://github.com/lgriffin/ESI.ts/commit/741000c28c2af735fd33442b809057afdaa23382))
* **ci:** fail pull requests that add a public export no test references ([4981c9d](https://github.com/lgriffin/ESI.ts/commit/4981c9db189cbe5e02e958a062c2fc4df8709f11))
* **ci:** file an issue when the spec drift check fails, not a red pull request ([ad06498](https://github.com/lgriffin/ESI.ts/commit/ad06498a9767732ff57954e31e60fdcb07ea6a64))
* **ci:** hold the API SemVer gate to squash merges ([bb0bdba](https://github.com/lgriffin/ESI.ts/commit/bb0bdbac1ae05ae8222d54c4d62431fdcd6187ba))
* **ci:** require a breaking-change commit when the public API report loses a line ([6363b31](https://github.com/lgriffin/ESI.ts/commit/6363b3139c40a8881fbcf3cce0a919d3fef14130))
* **ci:** run schema drift against its ratcheted baseline ([e113851](https://github.com/lgriffin/ESI.ts/commit/e1138514a174bf31f97e9303bb74c7e1e2cbcda2))
* **deps:** add a Dependabot cooldown for npm and GitHub Actions updates ([f595daa](https://github.com/lgriffin/ESI.ts/commit/f595daa66c0a68fe83d220694cc6d88d71cc3a2e))
* **deps:** bump @cucumber/gherkin from 28.0.0 to 42.0.1 ([899f128](https://github.com/lgriffin/ESI.ts/commit/899f128fbd230a81ea2613e558e16bb8ff05f28b))
* **deps:** bump @cucumber/messages from 24.1.0 to 34.2.1 ([bc563d4](https://github.com/lgriffin/ESI.ts/commit/bc563d4d3afedaa5ab1d914fa2afccb0486636da))
* **deps:** bump @cucumber/messages from 24.1.0 to 34.2.1 ([bf2414d](https://github.com/lgriffin/ESI.ts/commit/bf2414d8add5b0b872db7da21b0218a7f2cce742))
* **deps:** bump the minor-and-patch group with 7 updates ([7039ca7](https://github.com/lgriffin/ESI.ts/commit/7039ca7a64dae5013eb426e63905dcd36af9bf8e))
* **deps:** bump zod to 4.6.4 and js-yaml to 5.4.2 ([09dd9f0](https://github.com/lgriffin/ESI.ts/commit/09dd9f03888962f823f194bf7ae88ec1b6a276ca))
* **deps:** bundle Dependabot updates (zod, js-yaml, codeql-action) ([ea7a211](https://github.com/lgriffin/ESI.ts/commit/ea7a2113e24f90ecc3a5591bff8a23eb8b2ee5f4))
* **lint:** load the seam lint parser from the listed typescript-eslint package ([c87e31b](https://github.com/lgriffin/ESI.ts/commit/c87e31bd9183406838f7fbbfa7f2b984f4527d41))
* **lint:** ratchet wall-clock, timer and Math.random use in src/ ([8a9fb4f](https://github.com/lgriffin/ESI.ts/commit/8a9fb4fb5018c5744e57ab82f1107bdb455cdd50))
* **lint:** ratchet wall-clock, timer and Math.random use in src/ ([37ede1d](https://github.com/lgriffin/ESI.ts/commit/37ede1d541aa1ffad4998ef9c870ef15d75b210c))
* **scripts:** move the schema drift comparison into a testable core ([ba293c1](https://github.com/lgriffin/ESI.ts/commit/ba293c1f47a209161402103f924b3dc154a4bada))
* **scripts:** plain plurals in the schema drift ratchet messages ([99724b8](https://github.com/lgriffin/ESI.ts/commit/99724b8b578e30c858b4d3ac676d8abfa5c36477))


### Documentation

* **agents:** write the reviewer checklist and per-area agent notes ([113b145](https://github.com/lgriffin/ESI.ts/commit/113b14555986f9ef696a73c93a1606f467039048))
* **bdd:** list the batch 2 domains as converted ([446f914](https://github.com/lgriffin/ESI.ts/commit/446f914dd0d18f1655586cb1ee140b6b727d7e85))
* **bdd:** record the runner decision and the one-step-per-file layout ([266c6ea](https://github.com/lgriffin/ESI.ts/commit/266c6ead4762df12a20887b531135f625baa758d))
* **bdd:** state which leg carries the 100ms latency in the fan-out Rule ([b7ac123](https://github.com/lgriffin/ESI.ts/commit/b7ac123faff9b1d36919affea8ee8d5c0ebc893a))
* **guides:** describe ci-success, the live tier guard, cooldown and the no-retry nightly ([605333b](https://github.com/lgriffin/ESI.ts/commit/605333b8a745a02153fc1fa810edea35f34d2aaf))
* **guides:** document the seam lint and the BDD-only mutation ratchet ([9d228ad](https://github.com/lgriffin/ESI.ts/commit/9d228ad549ef2c8b542eb9247bff3ebe9f8591fb))
* **guides:** write the charter guides and retire docs/ ([8ffb88f](https://github.com/lgriffin/ESI.ts/commit/8ffb88f471e5259ad8f31fdee67ca1624194078e))
* **guides:** write the charter guides and retire docs/ ([5b61eaa](https://github.com/lgriffin/ESI.ts/commit/5b61eaa41929efadf5a7233a922adc7202fd4dde))
* **quality-gates:** document schema drift matching, guard and baseline ([ccb1ce1](https://github.com/lgriffin/ESI.ts/commit/ccb1ce10d45c29f4c820f7c8de6779c5afb5669d))
* **sde:** document js-yaml and adm-zip as optional peer dependencies ([d8d8843](https://github.com/lgriffin/ESI.ts/commit/d8d884364f997d91c1bdc2d540a9170939af3832))
* **semver:** add a semantic versioning guide and enforce it in CLAUDE.md ([48fedaa](https://github.com/lgriffin/ESI.ts/commit/48fedaa8fdac0ddba5326dc89b31e6b781cb68a2))
* **semver:** add a semantic versioning guide and enforce it in CLAUDE.md ([87d391b](https://github.com/lgriffin/ESI.ts/commit/87d391b14633262c4b58e1eb3b24af1f22cbe10c))


### Testing

* **api-semver-gate:** build the empty-report commit without moving HEAD ([b697a31](https://github.com/lgriffin/ESI.ts/commit/b697a3180c445f4cb199ed16a15dbdc409bf3e7c))
* **bdd:** add a runner-agnostic step library and a Jest binder ([d16b169](https://github.com/lgriffin/ESI.ts/commit/d16b1696078ad2658257777c854d8c09e2eb3b66))
* **bdd:** add the HTTP transport seam and ban client-method mocks ([1112b81](https://github.com/lgriffin/ESI.ts/commit/1112b815b59eba99a846f21a3104cd7b1ace57e4))
* **bdd:** assert only what the reconciled Rules promise ([3366028](https://github.com/lgriffin/ESI.ts/commit/336602818ec8544eb024f43bc93036e4b88149ac))
* **bdd:** convert access-lists, alliance, clones, cosmetics, dogma, insurance, meta and route to one step per file ([8117957](https://github.com/lgriffin/ESI.ts/commit/81179572c97f7d61bbc37427de0634f576b949a6))
* **bdd:** convert wars, killmails, wallet, mail and universe to one step per file ([997bc63](https://github.com/lgriffin/ESI.ts/commit/997bc63df4d71c7a6a52ee47551fc968ef250043))
* **bdd:** move every domain step file onto the transport seam ([538fdee](https://github.com/lgriffin/ESI.ts/commit/538fdee76aaea55df56a7f939ef8e1a4c6a22545))
* **bdd:** name the access-list 401 scenario for the token it uses ([41ef2cd](https://github.com/lgriffin/ESI.ts/commit/41ef2cd24f2159b1eb33b9c7aab1f7bbef990fe5))
* **bdd:** name two converted steps for the domain they assert ([602c0f9](https://github.com/lgriffin/ESI.ts/commit/602c0f9a46211cd2f2158d63fb25bef8f59f9439))
* **bdd:** ramp-up phase 2 — one step per file on a Jest step library, with a dry run ([a9a154d](https://github.com/lgriffin/ESI.ts/commit/a9a154d83f0ff55ae3d4dc8d760eff42695a4e13))
* **bdd:** send 204, 205 and 304 through the seam with no body ([643ab69](https://github.com/lgriffin/ESI.ts/commit/643ab69c98850ff3c5bf0c5be3581cbf43ccd4ef))
* **bdd:** split the access-lists steps into one file per step ([3eedda5](https://github.com/lgriffin/ESI.ts/commit/3eedda58fdf3962537e545ab800df83be479284a))
* **bdd:** split the alliance steps into one file per step ([49c6068](https://github.com/lgriffin/ESI.ts/commit/49c6068ffb7f6121253998cb6c194f6643637e06))
* **bdd:** split the clones steps into one file per step ([d75dda7](https://github.com/lgriffin/ESI.ts/commit/d75dda7630319f73160e8ffcb5d6b3c2fa8025bd))
* **bdd:** split the cosmetics steps into one file per step ([2bdb41d](https://github.com/lgriffin/ESI.ts/commit/2bdb41d447d7f82720a84928e1d0edfe8a337215))
* **bdd:** split the dogma steps into one file per step ([1b0a7e5](https://github.com/lgriffin/ESI.ts/commit/1b0a7e573edf8432caa3fa6d55234136fce31fc7))
* **bdd:** split the insurance steps into one file per step ([2baf51b](https://github.com/lgriffin/ESI.ts/commit/2baf51b9b45b84dcc9f6fe158cf7997a55d34dbd))
* **bdd:** split the killmails steps into one file per step ([d437485](https://github.com/lgriffin/ESI.ts/commit/d43748599a5fdfa4c4179a21fc2f1afeedff3cba))
* **bdd:** split the mail steps into one file per step ([7f4395e](https://github.com/lgriffin/ESI.ts/commit/7f4395ed1118bb338e89c028fe0534671ffe1203))
* **bdd:** split the market steps into one file per step ([a6af26e](https://github.com/lgriffin/ESI.ts/commit/a6af26e9999e0df2615db48dbab3fb91e1d505ff))
* **bdd:** split the meta steps into one file per step ([51fbcbb](https://github.com/lgriffin/ESI.ts/commit/51fbcbbf17bcbfea418a9d1f0a8a9e2ef4c0dd66))
* **bdd:** split the route steps into one file per step ([606b0e2](https://github.com/lgriffin/ESI.ts/commit/606b0e20fa466fcf3fd72b641a835d8816faac77))
* **bdd:** split the universe steps into one file per step ([4241d68](https://github.com/lgriffin/ESI.ts/commit/4241d68a4642703ff1b640860f2b7d0ffde25fa5))
* **bdd:** split the wallet steps into one file per step ([32c5305](https://github.com/lgriffin/ESI.ts/commit/32c5305d00a8fb941fbc3ad7b687bae9d7c0ca64))
* **bdd:** split the wars steps into one file per step ([76dfbff](https://github.com/lgriffin/ESI.ts/commit/76dfbffb0c17198120f9229a5850edc1dc9a6fa2))
* **bdd:** sync the transport seam with the integration branch ([8c0baa6](https://github.com/lgriffin/ESI.ts/commit/8c0baa6403e710839838d0e5342da58e084821b3))
* **bdd:** time the real pipeline in the performance Rules ([eb32df5](https://github.com/lgriffin/ESI.ts/commit/eb32df53bb7e9ba083240ca34789c2f4742b76f6))
* **cache:** specify entry retention past the freshness TTL ([cc4c04c](https://github.com/lgriffin/ESI.ts/commit/cc4c04c14a56c55ddf5abd2bb72fde5e2ebd319a))
* **clients:** give each shared error case its own ApiClient ([11259e3](https://github.com/lgriffin/ESI.ts/commit/11259e345af95b1ae3f6506512161920be8cb3e8))
* **consumer:** assert ./errors shares class identity with the root entry ([cb7575a](https://github.com/lgriffin/ESI.ts/commit/cb7575abc9f187733023bf57b286d7c3e90e3a6b))
* **consumer:** install the packed tarball into a clean consumer and run it ([517ce18](https://github.com/lgriffin/ESI.ts/commit/517ce18d1e023ea72b028e73caa56d686cbc0fd9))
* **consumer:** load SDE metadata nested under sde: in the optional-peers probe ([8375d14](https://github.com/lgriffin/ESI.ts/commit/8375d1440ab4870aba8ba51b65fd7ecc8cdd34d4))
* **etag-cache:** specify stale-on-error over HTTP ([ded4537](https://github.com/lgriffin/ESI.ts/commit/ded45377795087318e438a1315d0a41e096089eb))
* **export-coverage:** fail when a public export has no test referencing it ([c6920ce](https://github.com/lgriffin/ESI.ts/commit/c6920ceea24a2b9aa574a267bc61e620a103b8bd))
* **export-coverage:** report public exports that no test references ([ff5bf1f](https://github.com/lgriffin/ESI.ts/commit/ff5bf1f2f43d7221874c2b546b8f543a6bb7b5b0))
* **fuzz:** inject schema-violating ESI bodies through the transport seam ([e4cd35d](https://github.com/lgriffin/ESI.ts/commit/e4cd35dce60e643996a3368c1fda8b5b229ecfc9))
* make client suites order-independent and randomise the nightly no-retry run ([02e9b77](https://github.com/lgriffin/ESI.ts/commit/02e9b770981f3caaa2a5b349406c8dbfeb263fa7))
* make the live integration and contract tiers fail loudly without ESI_LIVE_TESTS ([79aee8b](https://github.com/lgriffin/ESI.ts/commit/79aee8b3b9a47917d16aa8a1a09a55f814532535))
* **mutation:** add a BDD-only Stryker run with a per-directory ratchet ([c47dde1](https://github.com/lgriffin/ESI.ts/commit/c47dde17ecff0d196c4c03d88a92faf062c4b641))
* **resilience:** specify retry classes, circuit states and dedupe over HTTP ([bf42a7a](https://github.com/lgriffin/ESI.ts/commit/bf42a7ac9bc0d6652dc2aa2b5d1d5c24e386f3a4))
* **scripts:** schema drift reports drift behind definition-style paths ([46bb854](https://github.com/lgriffin/ESI.ts/commit/46bb854dda03b8eaffdab7d979a28df04c0e3e12))
* **skills:** build the review fixture's EsiError with status first ([5f3553f](https://github.com/lgriffin/ESI.ts/commit/5f3553f77c28933282923fae09d59ae39218ef1f))
* **spec-audit:** hold step files to one step per file and ratchet the legacy ones ([405298e](https://github.com/lgriffin/ESI.ts/commit/405298e75bede0da43a83ce14ad2ba2294511475))
* **spec-audit:** skip the CLI fixtures where the audit cannot start ([3cb173e](https://github.com/lgriffin/ESI.ts/commit/3cb173eb3ed7a0587b4a87c9b517c0405f258fba))

## [Unreleased]

### Added

- **`EsiTokenManager`** — higher-level auth abstraction that owns the SSO token lifecycle for one or many characters (#185). Exchanges an authorization code, decodes the character id, name and scopes from the token, persists it through a pluggable `ITokenStorage`, refreshes ahead of expiry (`refreshSkewMs`, default 60 s), coalesces concurrent refreshes per character, persists the rotated refresh token before returning, and records an SSO `invalid_grant` so later calls fail locally with `TokenRevokedError`. `createClient(characterId)` returns an `EsiClient` wired with the character's token and a refresh provider bound to the manager; `tokenProviderFor(characterId)` exposes that provider for clients built by hand
- **Bulk refresh** — `refreshAll({ concurrency, expiringWithinMs, signal })` refreshes stored tokens with a concurrency cap (default 5), isolates failures per character, skips tokens outside an optional staleness window, and flags SSO 429/5xx failures as `retryable` (#187). Per-character failures never reject; every character gets a `RefreshResult`. A throwing `onProgress` callback and a non-finite `concurrency` value are tolerated; only a storage adapter that cannot list tokens rejects the call
- **`EveSsoClient`** — zero-dependency client for `login.eveonline.com`: `getAuthorizationUrl`, `exchangeCode`, `refresh`, `revoke`. `exchangeCode` repeats the `redirect_uri` from the authorization request (configured `callbackUrl` or a per-request `redirectUri`); an `invalid_grant` on a code exchange or revoke stays an `SsoError` and only a refresh maps it to `TokenRevokedError`; a 2xx body that is not a JSON object with both tokens is reported as `SsoError` `invalid_response`. Confidential clients authenticate with HTTP Basic; public clients use PKCE (`generatePkcePair`, `generateState`). SSO errors surface as `SsoError` (status + OAuth error code) or `TokenRevokedError`
- **Storage adapters** — `MemoryTokenStorage` and `FileTokenStorage` (atomic temp-file-and-rename writes, `0600` mode, serialised in-process writes, malformed entries skipped on load, `invalidate()` fenced against reads already in progress)
- **`runWithConcurrency`** internal utility in `src/core/util/concurrency.ts`
- `tests/bdd/features/core/0054-token-management.feature` — 26 EARS requirements covering the above, including the refresh-versus-removal and refresh-versus-re-authorization races, which the manager resolves in favour of the newer state
- `examples/token-manager.ts` and `npm run example:token-manager`

## [9.9.0] - 2026-09-15

### Added

- **Per-client structured logging** — `EsiClientConfig.logger` and `EsiClientConfig.logLevel` attach an `ILogger` to one client. `ILogger` gains `fatal` and `trace` levels and a second `context` argument; the pipeline now logs structured fields (`endpoint`, `method`, `url`, `status`) instead of interpolated strings. New root exports: `createDefaultLogger`, `toPinoLogger`, `getLogger`, `logFatal`, `logError`, `logWarn`, `logInfo`, `logDebug`, `logTrace`, `LogContext`, `LogLevel`
- **`guides/CHARTER.md`** — the engineering charter: architecture, design rules, testing tiers, quality gates, security, documentation, release and process as numbered EARS requirements with their enforcing script or CI job. Its gap register and guide roadmap are tracked as beads under `esi-l38` and GitHub issues #262–#287

### Changed

- The global `setLogger()` now applies to every client that has no logger of its own. Resolution order is per-client logger, then the global logger, then the built-in pino default at `ESI_LOG_LEVEL` (default `warn`)
- The default export of `core/logger/logger` is deprecated in favour of `createDefaultLogger(level?)`
- TypeDoc output moved from `docs/` to `docs-site/public/api/` (git-ignored). `npm run clean` and `npm run docs` no longer delete the hand-written markdown in `docs/`
- Version sources realigned: `src/core/constants.ts` and the release-please manifest had stayed at 9.8.0 while `package.json` moved to 9.8.1

### Fixed

- `toPinoLogger` detached pino's methods from their instance, so every log call through the default logger threw `Cannot read properties of undefined (reading 'Symbol(pino.msgPrefix)')`

## [9.8.0] - 2026-09-10

No change to the published API surface — this release is entirely about how
the library's behaviour is specified and enforced. Consumers upgrading from
9.7.0 get identical runtime code.

### Added

- **EARS specification for the BDD suite** — all 52 feature files in `tests/bdd/` are now written as 327 atomic requirements in Easy Approach to Requirements Syntax, one per Gherkin `Rule:` block, with the scenarios that verify each nested beneath it. The same 401 scenarios run as before; no test was added, dropped, or merged
- **`npm run spec:audit`** — parses the Gherkin AST and enforces requirement form: exactly one `shall` per Rule, no vague or unmeasurable language, correct EARS grammar for `If`/`While`/`When`/`Where`, no requirement hidden in prose, no scenario outside a Rule, no feature without a description. Also `npm run spec:audit:verbose`. Runs as a required CI check (`EARS Spec Audit`) and as the final step of `npm run check:all`
- **`tests/bdd/GUIDE.md` and `tests/bdd/README.md`** — the conventions and a practical guide to writing requirements, including the pattern decision procedure, a finding-by-finding fix table, and the anti-pattern catalogue

### Changed

- **Requirements now state what the tests actually assert.** Deriving each requirement from its assertions rather than its old scenario title surfaced scenarios whose titles claimed coverage the assertions never provided — a "transitions to half-open" check that asserts the circuit is closed, an "empty result" case that expects a 404 rejection, performance titles with no stated bound. Those requirements are now written narrowly and honestly, and the gaps are tracked as issues rather than papered over
- Four Gherkin step texts corrected where they misnamed the fixture or the method under test
- `@cucumber/gherkin` and `@cucumber/messages` promoted from transitive to explicit devDependencies
- Types regenerated from the ESI spec (hash only; no interface changes)

## [9.7.0] - 2026-09-09

First release since 9.6.0. Versions 9.6.1 and 9.6.2 were bumped in
`package.json` but never published, so upgrading from 9.6.0 picks up
everything below.

### Added

- **`fetchAllPages` concurrent pagination** — fetch every page of a paginated endpoint in parallel with configurable concurrency (default 8). Adds `fetchAllEndpoint()` on `BaseEsiClient` and 73 `fetchAll*` convenience methods across all 19 domain clients, mirroring the existing `stream*` methods ([#180](https://github.com/lgriffin/ESI.ts/issues/180))
- **Typed response headers on `EsiResponseMeta`** — `etag`, `pages`, `expires`, `errorLimitRemain` and `errorLimitReset` are now typed fields, so consumers get autocomplete and type safety instead of raw string header lookups ([#179](https://github.com/lgriffin/ESI.ts/issues/179))
- **Per-endpoint rate limit overrides** — `endpointOverrides` in `RateLimiterConfig` lets you set endpoint-specific limits that take precedence over the generated group specs, for tightening sensitive endpoints such as market history ([#181](https://github.com/lgriffin/ESI.ts/issues/181))
- **`FetchLike` injection and `createNoopLogger()`** — `ApiClient` accepts an injectable `fetch` via `setFetch()` / `getFetch()` so tests can substitute in-memory doubles, and `createNoopLogger()` gives silent test output. Ships with an `InMemoryFetch` test helper ([#213](https://github.com/lgriffin/ESI.ts/issues/213), [#214](https://github.com/lgriffin/ESI.ts/issues/214))
- **`npm run help`** — a grouped, intent-organised command reference replacing the flat ~100-entry script listing, with keyword search (`npm run help wallet`)

### Changed

- **Actionable auth error messages** — `NO_AUTH_TOKEN`, 401 and 403 errors now name the likely cause (missing `ESI_ACCESS_TOKEN`, expired token, missing OAuth scopes) and the specific fix (env var, `setAccessToken`, `onTokenRefresh` callback, or scope configuration)
- **`npm audit` moved off the PR merge path** — the merge path now runs a diff-aware `Dependency Audit` job that compares base against head and fails only on advisories a PR _introduces_. Pre-existing advisories are the nightly audit's responsibility, so a third-party disclosure no longer turns unrelated PRs red ([#248](https://github.com/lgriffin/ESI.ts/pull/248))
- **Audit acceptance allowlist** — reviewed known risks are recorded in `scripts/audit-exceptions.json` with a reason and a mandatory expiry date, honoured by the PR gate, the nightly audit and the release gate. An entry past its expiry is a hard failure
- **Schemathesis moved off the PR path** to a nightly run ([#234](https://github.com/lgriffin/ESI.ts/pull/234))
- **Types regenerated from the ESI spec** — upstream renamed `AllianceDetail` to `AlliancesDetail`
- Dependency updates: zod, eslint, jest, knip, lint-staged, `@redocly/cli`, `@types/node`

### Fixed

- **`USER_AGENT` reported a stale version** — `src/core/constants.ts` had drifted to `9.2.0` while `package.json` was on `9.6.1`, so requests identified themselves to CCP as `esi.ts/9.2.0`. `package.json`, `constants.ts` and `.release-please-manifest.json` are now aligned
- **Nightly audit report corruption** — `nightly-audit.yml` merged stderr into its JSON report, so a single warning line would have made every `jq` query silently report zero vulnerabilities
- Zod v4 deprecation: `z.ZodTypeAny` replaced with `z.ZodType`

## [9.1.0] - 2026-08-14

### Added

- **Schema rejection tests** — 104 new tests verifying Zod schemas correctly reject invalid input shapes
- **Domain property fuzz tests** — property-based fuzz testing across domain clients using fast-check
- **Schema validation benchmarks** — performance benchmarks for Zod schema validation paths
- **Domain response type tests** — compile-time type tests for domain client response types via tsd

### Changed

- **Expanded documentation** — updated examples, architecture guide, and testing guide with broader coverage
- **README refreshed** — updated feature descriptions and endpoint counts

### Fixed

- **Fuzz test date handling** — switched to integer-based date arbitrary to avoid invalid `Date` values in property-based tests

## [9.0.0] - 2026-08-12

### Breaking Changes

- **Default retry count changed from 0 to 3** — transient failures (502, 503, 504, timeout, rate limit) now retry automatically with exponential backoff and jitter. Set `maxRetries: 0` in `retryConfig` to restore the previous behavior
- **Generated Zod schemas removed** — the `src/schemas/generated/` directory has been removed; only hand-written schemas in `src/schemas/` remain

### Added

- **Sub-path exports** — targeted imports for reduced bundle size:
  - `@lgriffin/esi.ts/schemas` — Zod schemas for runtime validation
  - `@lgriffin/esi.ts/errors` — error classes and type guards
  - `@lgriffin/esi.ts/testing` — `TestDataFactory` for test mock data
- **`isCircuitOpen()` type guard** — checks whether an error is a `CircuitOpenError`, complementing the existing `isTimeout()`, `isRetryable()`, and `isValidationError()` guards
- **`generate:all` script** — runs all generators (types, endpoints, OKF) in one command
- **`generate:endpoints` script** — regenerates endpoint definitions from the ESI OpenAPI spec

### Changed

- **Cursor pagination routed through full pipeline** — cursor-based pagination now goes through the same middleware pipeline (rate limiter, circuit breaker, retry, caching) as offset pagination
- **Pagination retry unified with `IRetryStrategy`** — pagination requests now use the injectable retry strategy instead of a separate retry path

### Fixed

- **Response interceptor status fix** — response interceptors previously received a hardcoded 200 status; they now receive the actual HTTP status code from the response
- **CI consolidated** — `pr-validation.yml` merged into `ci.yml`; all PR validation now runs through the main CI pipeline

## [7.4.0] - 2026-07-17

### Added

- **`withSafeMode()` on all domain clients** — mirrors existing `withMetadata()`, surfaces the `EsiResult<T>` discriminated union (`{ ok: true, data, meta } | { ok: false, error }`) without needing to call `createClient()` directly
- **`responseSchema` on `routeEndpoints`** — was the only endpoint file without runtime response validation; now validated with `z.looseObject({ route: z.array(z.number()) })`

### Changed

- **ESLint 8 → 10 flat config migration** — replaced `.eslintrc.cjs` with `eslint.config.mjs`, switched to unified `typescript-eslint` package, dropped `eslint-plugin-prettier` (redundant with lint-staged)
- **jest-fetch-mock 3 → 4** — updated null-body status mocks (204/304) to use `new Response(null, ...)` per Fetch spec
- Updated 11 minor/patch dependencies: @commitlint/cli, @microsoft/api-extractor, @redocly/cli, @types/node, @typescript-eslint/*, eslint-plugin-sonarjs, fast-check, knip, prettier, typedoc

### Fixed

- CI: aligned `codeql.yml` branch targets to `[master, main, develop]`
- CI: pinned `jest-coverage-comment@main` → `@v1.0.34` (supply-chain risk)
- CI: added schema drift and generated types freshness checks to release pipeline

### Deprecated

- `AllianceClient.getContacts()` — use `ContactsClient.getAllianceContacts()` instead
- `AllianceClient.getContactLabels()` — use `ContactsClient.getAllianceContactLabels()` instead

## [7.3.0] - 2026-07-14

### Added

- **`EsiResult<T>` discriminated union** and `safeMode` option for error-safe API calls
- **Branded ID types** (16 types) for type-safe ESI entity references
- **Expanded type-level tests** with tsd for error guards, endpoints, and domain types
- **Compile-time spec-to-Zod type alignment checks**
- **Schema drift detection** as a blocking CI check
- **Comprehensive testing gap closure** (+1233 tests)

### Fixed

- Resolved three CI jobs failing with continue-on-error
- Normalized CRLF in API surface check
- Fixed schemathesis report permissions and `--url` flag
- Fixed API surface ordering issues
- Added missing `system_id` to `MarketOrderSchema` test data

## [7.2.0] - 2026-07-08

### Added

- **Contract testing infrastructure** — deep validation of all endpoint definitions against the live ESI OpenAPI spec (`npm run contract:live`). Checks path parameter alignment, required query params, request body consistency, auth requirements, response schema coverage, HTTP methods, pagination metadata, and deprecation sync. 8 contract validation categories with known-exception tracking.
- **Property-based fuzz testing** with [fast-check](https://github.com/dubzzz/fast-check) — 601 tests fuzzing `validatePathParam()`, `validateQueryParam()`, `buildEndpointPath()`, and all Zod schemas with random/adversarial inputs (`npm run fuzz`)
- **OpenAPI spec snapshot & diff** — `npm run contract:snapshot` saves a baseline; `npm run contract:diff` detects breaking changes via [oasdiff](https://github.com/Tufin/oasdiff) (Docker)
- **Consumer type tests** with [tsd](https://github.com/tsdjs/tsd) — verifies public API type correctness (`npm run test:types`)
- **Prism mock server** — `npm run mock:esi` starts a spec-conformant ESI mock on port 4010 via [@stoplight/prism-cli](https://stoplight.io/open-source/prism)
- **Schemathesis fuzz runner** — `npm run fuzz:api` runs Schemathesis against the Prism mock (Docker, weekly CI)
- Contract and fuzz test CI jobs added to `ci.yml` quality gate
- Weekly spec drift detection job added to `maintenance.yml`
- `jest.contract.config.cjs` and `jest.fuzz.config.cjs` test configurations

### Dependencies

- Added `fast-check` (dev) — property-based testing framework
- Added `@stoplight/prism-cli` (dev) — OpenAPI mock server
- Added `tsd` (dev) — TypeScript type testing

## [7.1.0] - 2026-07-08

### Added

- **Redocly CLI integration** — lints the live ESI OpenAPI spec for structural validity and best-practice compliance (`npm run validate:spec`). Catches spec breakage from CCP before it breaks generated types, cache TTLs, or scopes. Baseline: 0 errors, 328 warnings (all known CCP spec issues).
- `redocly.yaml` config with tuned rulesets for ESI — structural rules as errors, CCP spec quirks as warnings
- `validate:spec` npm script added to `check:all` pipeline

## [7.0.0] - 2026-07-08

### Breaking Changes

- **Swagger 2.0 → OpenAPI 3.1 migration** — all generated types, cache TTLs, scopes, and rate limit groups are now sourced from the ESI OpenAPI 3.1 spec (`/meta/openapi.json`) instead of the deprecated Swagger 2.0 spec (`/latest/swagger.json`). See [esi-issues#1490](https://github.com/esi/esi-issues/issues/1490).
- **Generated interface names changed** — `EsiSpec` namespace types now use OpenAPI schema names (e.g., `AllianceDetail` instead of `GetAlliancesAllianceIdOk`). These are generated types; hand-written consumer types are unchanged.
- **Cache TTL metadata key** — internally changed from `x-cached-seconds` to `x-cache-age`. No consumer-facing impact (cache behavior is identical).

### Changed

- Single OpenAPI spec fetch instead of dual Swagger + OpenAPI fetches
- Updated all scripts, tests, and documentation to reference OpenAPI spec
- Generated types now include 161 interfaces (up from 147), 126 cache TTLs, 70 scopes

## [6.1.0] - 2026-07-07

### Added

- **Fleet wing/squad name validation** — `renameFleetWing()` and `renameFleetSquad()` now reject names exceeding ESI's 10-character limit before sending the request, with a clear error message
- **43 runnable example scripts** covering all 210 ESI endpoints against live Tranquility (10 new example files: character-details, corporation-details, calendar-search, loyalty-pi, faction-details, industry-mining, market-orders, universe-encyclopedia, corp-contracts-wallet, dogma-meta-sov)
- **3 write-operation example scripts** — `write-operations.ts` (contacts, fittings, mail, UI lifecycle), `universe-post-helpers.ts` (name resolution, affiliation), `freelance-jobs.ts` (cursor-paginated queries)
- Live output captured for all example scripts in `examples/output/`
- 3 new TDD test files and 1 new BDD feature file (81 TDD files, 40 BDD features total)
- 2 new fleet validation unit tests

### Fixed

- **Fleet test babel parse errors** — replaced TypeScript cast syntax `(result as any[]).forEach(...)` with direct index access in fleet tests (pre-existing bug unmasked by stricter transpilation)
- **Fleet rename test names** — test mock names shortened to respect ESI's 10-character limit (`'New Squad Name'` → `'New Squad'`)

### Changed

- README rewritten with "Why ESI.ts vs. OpenAPI-generated clients" comparison, full endpoint coverage table, and updated architecture/testing references
- `guides/ARCHITECTURE.md`, `guides/TESTING.md`, and `TESTING.md` updated to current test counts (121 suites, 3,224 tests)
- Autopilot example waypoint changed from Jita to Rens

### Schemas

- Multiple Zod schema fixes discovered during live endpoint validation: added missing enum values, corrected optional fields, and adjusted types to match actual ESI responses

## [6.0.0] - 2026-07-03

### Added

- **Runtime response validation** via [Zod](https://zod.dev/) schemas — every ESI endpoint response is validated at runtime, catching shape mismatches before they propagate to consumer code
- Zod schemas for all 31 domain modules (133 interfaces) in `src/schemas/`, exported under the `schemas` namespace
- `EsiValidationError` class (extends `EsiError`) thrown when response data doesn't match the expected schema
- `isValidationError()` type guard for catching validation errors
- `validateResponse` option on `EsiClientConfig` — on by default, can be disabled globally
- `responseSchema` field on `EndpointDefinition` — wires schemas into the request pipeline via `createClient()`
- New developer guide: `guides/RUNTIME-VALIDATION.md`
- Response Validation Pipeline diagram in `guides/ARCHITECTURE.md`
- Comprehensive TDD tests for schema parsing, validation integration, and common schemas (94 new tests)
- BDD feature and step definitions for 9 runtime validation scenarios

### Changed

- All TypeScript types in `src/types/` are now derived from Zod schemas via `z.infer<>` — schemas are the single source of truth
- Schemas use `.passthrough()` mode so extra fields from ESI are preserved, not rejected
- Test mock data across 25 test files updated to be spec-accurate (required by runtime validation)
- Path-parameter IDs (e.g., `character_id`, `alliance_id`) are now optional in schemas, matching ESI which omits them from response bodies

### Dependencies

- Added `zod` as a production dependency

## [5.3.0] - 2026-06-30

### Added

- **Accept-Language configuration** — `language` option on `EsiClientConfig` injects the `Accept-Language` header for localized ESI responses (en, de, fr, ja, ru, zh, ko, es); changeable at runtime via `ApiClient.setLanguage()`
- **ESI scope metadata** — generated `esi-scopes.generated.ts` with `EsiScope` union type (63 scopes) and `esiEndpointScopes` record mapping 119 authenticated endpoints to their required OAuth scopes
- Exported `EsiScope` type and `esiEndpointScopes` map from package root
- **Streaming pagination** — `stream*` methods on domain clients yield `PageResult<T>` one page at a time via `AsyncGenerator`, enabling backpressure and early termination for large paginated datasets
- Streaming methods added to `MarketClient` (6), `ContractsClient` (3), `WalletClient` (3), `AssetsClient` (2), `KillmailsClient` (2)
- `buildEndpointPath()` utility extracted from `createClient.ts` and exported from package root
- `streamEndpoint()` protected method on `BaseEsiClient` for building custom streaming domain clients
- Streaming pagination example (`npm run example:streaming`)

## [5.2.0] - 2026-06-29

### Added

- **Spec-driven type generation** from ESI swagger spec (`npm run generate:types`) — 147 TypeScript interfaces + cache TTL map for 119 endpoints
- **Spec-aware cache bypass** — GET requests within ESI-specified `x-cached-seconds` TTL return cached data with zero HTTP calls, layered on top of ETag caching
- **`batch()` and `batchPost()` methods** on `EsiClient` — bounded concurrency for multi-ID fetches, auto-chunking for POST endpoints
- **`EsiSpec` namespace export** with generated response types alongside hand-written types
- **Type drift detection** in `npm run validate:esi` — compares hand-written types against generated spec types
- CI step to verify generated types are up to date
- **Retry with exponential backoff** — configurable retry for transient 5xx, timeout, and rate limit errors with jitter; respects circuit breaker state; GET-only by default with `retryMutations` opt-in
- **`TimeoutError`** subclass of `EsiError` — typed timeout errors with `timeoutMs` property; per-request timeout override via `handleRequest()`
- **Enhanced response metadata** via `withMetadata()` — rate limit info (`RateLimitMeta`), response timing (`responseTimeMs`), and cache hit type (`cacheHitType`: `'spec-ttl'` | `'etag-304'` | `'stale-on-error'`)
- `RetryConfig` interface and `retryConfig` option on `EsiClientConfig`
- `CircuitOpenError` passthrough in request handler (previously wrapped as generic Error)
- **Per-group rate limiting** — 36 ESI rate limit groups extracted from the OpenAPI meta spec at build time; each group gets its own token bucket instead of a single global counter, preventing a burst of market requests from starving unrelated endpoints
- **Optional per-user bucketing** — `userKeyExtractor` config option creates separate bucket sets per user key, supporting multi-character EVE applications
- **Group-aware rate limit status** — `getGroupStatus(group)` and `getAllGroupStatuses()` methods for fine-grained rate limit monitoring; `isBlocked(group?)` accepts an optional group name
- Generated `esi-rate-limit-groups.generated.ts` with 146 endpoint-to-group mappings
- Exported `RateLimitGroupStatus` and `RateLimitGroupSpec` types

## [5.1.0] - 2026-06-26

### Added

- **`noUncheckedIndexedAccess`** compiler flag — array/record indexing now returns `T | undefined`, catching unguarded index access at compile time
- **`noImplicitReturns`** compiler flag — all function code paths must explicitly return a value
- **`noImplicitOverride`** compiler flag — `override` keyword required when overriding base class methods
- **`tsconfig.test.json`** — separate TypeScript config for tests, relaxing `noUncheckedIndexedAccess` for test utility patterns

### Changed

- `RateLimiter` token cost lookup inlined (removed unnecessary `Record` indirection)
- Jest configs (`jest.unit.config.cjs`, `jest.integration.config.cjs`) now use `tsconfig.test.json`

### Fixed

- Unguarded indexed access in `ApiRequestHandler`, `CircuitBreaker`, `RateLimiter`, and `headersUtil`

## [5.0.0] - 2026-06-26

### Breaking Changes

- **Removed `SovereigntyClient.getSovereigntyMap()`** — sunset ESI endpoint; use `getSovereigntySystems()` instead
- **Removed `SovereigntyClient.getSovereigntyStructures()`** — sunset ESI endpoint; use `getSovereigntySystems()` instead

### Added

- **Dependabot** — automated weekly dependency update PRs with grouped ESLint and testing ecosystems
- **CodeQL Analysis** — GitHub-native security scanning workflow
- **Commitlint** — conventional commit message validation via husky hook
- **Version consistency script** — `npm run validate:versions` checks `package.json` matches `constants.ts`
- **`npm run check:all`** — comprehensive validation including ESI endpoint and version checks
- Coverage and npm download badges in README
- `.editorconfig`, `.nvmrc`, `CONTRIBUTING.md`, `SECURITY.md`
- ClientRegistry test coverage for all 35 client types

### Fixed

- **POST body format** for asset and contact endpoints — request body was incorrectly structured
- **POST body format** for `/universe/ids` and `/universe/names` — same issue
- **Circuit breaker** now treats HTTP 420/429 rate-limit responses as failures
- **configManager** uses `require.resolve` instead of `process.cwd()` fallback for reliable path resolution
- **User-Agent version** — ESI requests were sending `esi.ts/3.4.0` instead of current version
- **Compatibility date** — updated from `2025-12-16` to `2026-05-19` (Equinox)
- TypeScript badge in README updated from 5.0+ to 6.0+

### Removed

- `src/TODO` — fully completed roadmap
- `jest.improved.config.cjs` — dead config matching zero test files
- `docs/` — generated TypeDoc output removed from git tracking (CI builds as artifact)
- Unused `getHeaders` test helper

### Changed

- `package.json`: added `keywords`, `homepage`, `bugs` URLs, `files` includes README/LICENSE/CHANGELOG
- Moved `docs/architecture.md` to `guides/ARCHITECTURE.md`
- Updated `guides/TESTING.md` and `guides/DOCUMENTATION.md` to current state
- Test coverage raised from 75% to 91%+

### Dependencies

- `@typescript-eslint/eslint-plugin`: 7.18.0 → 8.x
- `@typescript-eslint/parser`: 7.18.0 → 8.x
- `@types/node`: 18.x → 26.x
- `@commitlint/cli`: 19.x → 21.x
- `eslint-config-prettier`: 9.x → 10.x
- `lint-staged`: 16.x → 17.x
- `jest-junit`: 16.x → 17.x
- GitHub Actions: checkout v4→v7, setup-node v4→v6, upload-artifact v4→v7, codeql-action v3→v4, gh-pages v3→v4, action-gh-release v1→v3

## [4.1.1] - 2026-06-08

### Changed

- **TypeScript 5.9 → 6.0** — upgraded to TypeScript 6.0.3, the last version before the Go-based TS7 compiler
- `tsconfig.json`: added explicit `moduleResolution: "bundler"` (TS6 changed the default from `node` to `bundler`)
- `tsconfig.json`: added explicit `rootDir: "./src"` (TS6 requires this when emitting)
- `tsconfig.json`: removed `esModuleInterop: true` (always-on in TS6)

## [4.1.0] - 2026-06-08

### Added

- **Equinox ESI compliance** — new endpoints and types for the [Equinox expansion](https://developers.eveonline.com/blog/equinox-on-esi-structures-sovereignty-and-access-lists) (compatibility date 2026-05-19)
- **`SovereigntyClient.getSovereigntySystems()`** — combined sovereignty systems route with separate ADM indices (`military_index`, `industry_index`, `strategic_index`), occupancy data, and anchored structures in a single response
- **`SkyhooksClient`** — new domain client with `getSovereigntyHubs()`, `getOrbitalSkyhooks()`, and `getRaidableSkyhooks()` endpoints for Upwell sovereignty structures
- **`MercenaryClient`** — new domain client with `getMercenaryDens()` and `getMercenaryTacticalOperations()` endpoints for mercenary content
- **`AccessListsClient`** — new domain client with `getAccessList(id)` for reading access list (ACL) contents including character, corporation, and alliance entries
- `TestDataFactory` methods for all new Equinox types: `createSovereigntySystem()`, `createSovereigntyHub()`, `createOrbitalSkyhook()`, `createRaidableSkyhook()`, `createMercenaryDen()`, `createMercenaryTacticalOperation()`, `createAccessListEntry()`
- TDD and BDD test coverage for all new endpoints

### Changed

- `SovereigntyClient.getSovereigntyMap()` and `getSovereigntyStructures()` marked as deprecated — use `getSovereigntySystems()` instead
- Domain client count increased from 32 to 35

### Dependencies

- `ts-jest`: 29.4.9 → 29.4.11
- `eslint-plugin-prettier`: 5.5.5 → 5.5.6

## [4.0.0] - 2026-05-15

### Breaking Changes

- **Removed `RateLimiter.getInstance()` singleton** - Create instances with `new RateLimiter()` instead
- **Removed global cache/circuit breaker functions** - `initializeETagCache()`, `getETagCache()`, `resetETagCache()`, `initializeCircuitBreaker()`, `getCircuitBreaker()`, `resetCircuitBreaker()` are no longer exported from `ApiRequestHandler`
- Each `EsiClient` and `ApiClientBuilder` now creates its own `RateLimiter`, `ETagCacheManager`, and `CircuitBreaker` instances

### Added

- **`BaseEsiClient` base class** — eliminates ~650 lines of repeated constructor/field/`withMetadata()` boilerplate across all 33 domain clients
- **`RequestDeduplicator`** — coalesces concurrent identical GET requests into a single in-flight fetch, sharing the result across all callers (enabled by default; disable with `enableRequestDeduplication: false`)
- **`EsiDiagnostics` API** — `client.diagnostics` accessor for cache/circuit-breaker stats, moved out of the main `EsiClient` API surface
- **`fetchPages()` async generator** — memory-efficient page-by-page iteration over paginated ESI responses
- **Request timeouts** — `config.timeout` now wired to `AbortController` (default 30s); previously the field existed but was never connected to `fetch()` calls
- **`EsiError` retry helpers** — `isTimeout()`, `retryable` getter, and `isRetryable()` guard for smarter consumer retry logic
- **`RateLimiterConfig`** — `minDelayMs` and `decelerationThreshold` exposed via `EsiClientConfig` for consumer-tunable rate limiting
- TypeScript declaration files (`.d.ts`) now emitted with builds
- `exports` field in `package.json` for modern Node.js module resolution
- `engines` field specifying Node.js >= 18.0.0
- `publishConfig` with public access for scoped package
- `RateLimiter`, `ETagCacheManager`, and `CircuitBreaker` classes exported from main index
- `ApiClientBuilder.setRateLimiter()`, `.setCache()`, `.setCircuitBreaker()` builder methods
- `validateBaseUrl()` for SSRF protection — validates ESI host allowlist and HTTPS
- `unsafeAllowCustomHost` config option to bypass base URL validation
- URL sanitization in `EsiError` — sensitive query params (`token`, `access_token`, `api_key`) are redacted
- Path parameters encoded with `encodeURIComponent()` for defense-in-depth
- URL assertions in all client unit tests — every test now verifies the correct endpoint URL
- Endpoint definition contract tests — 1800+ tests validating path templates, params, methods
- Test coverage for `RequestDeduplicator`, `EsiDiagnostics`, `AsyncPaginationIterator`, and extended `EsiError` tests
- `CHANGELOG.md` following Keep a Changelog format
- Changelog validation step in release workflow

### Fixed

- `.d.ts` files not generated during build (`declaration: true` added to `tsconfig.json`)
- Release pipeline CNAME placeholder removed from GitHub Pages deployment
- `ContractsClient.ts` test file renamed to `.test.ts` so Jest actually runs it

### Changed

- `RateLimiter` constructor is now public
- Cache, rate limiter, and circuit breaker are instance-based per client (no global shared state)
- `ApiClientBuilder.build()` auto-creates a `RateLimiter` if none was explicitly set
- `api-responses.ts` (1366 lines) split into 29 domain-specific type files with barrel re-export for backward compatibility
- `RateLimiter` uses `logWarn` instead of `console.warn` for consistent observability
- Reduced allocations and deduplicated fetch/sleep logic across core modules

## [3.4.0] - 2026-04-29

### Added

- ESI response header best practices documentation
- Dogma test coverage (10 TDD + 9 BDD tests)
- Gated authenticated integration tests (32 tests across 14 endpoint groups)
- EVE SSO token creator for local integration testing
- Search endpoint `categories` query parameter

### Fixed

- 3 industry endpoint paths (`corporation` -> `corporations`) for mining routes
- Pagination middleware bypass: pages 2+ now route through request pipeline
- Consolidated duplicate alliance contact endpoints
