# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [11.0.0](https://github.com/lgriffin/ESI.ts/compare/v10.2.3...v11.0.0) (2026-09-28)


### ⚠ BREAKING CHANGES

* Node 18 and Node 20 are no longer supported; both are end of life. package.json now declares "engines": { "node": ">=22.12.0" } and CI no longer tests older lines. Consumers on Node 18 or 20 should stay on 10.x or upgrade Node to 22.12 or later.
* **errors:** EsiValidationError, CircuitOpenError and the fault classes report retryable false and isTimeout() false; before, every status-0 error reported true for both. CircuitOpenError and the former plain [CODE] errors are now EsiError instances, so isEsiError() is true for them. A fault raised inside a request loses its extra "[ESIJS_ERROR] " prefix. The internal buildError helper is removed.
* **schemas:** meta.getChangelog() resolves to { changelog } instead of the bare per-date map, and MetaChangelogEntry has type in place of is_breaking. Read result.changelog[date] where you read result[date], and compare entry.type === 'breaking' where you read entry.is_breaking. Before this change the method could not succeed against live ESI.
* **schemas:** CorporationInfo.ceo_id, creator_id and tax_rate are now optional; read tax_rates.isk when tax_rate is absent. MetaClient.getName() returns { current, history } instead of { name }; read `current`. MilitaryCampaignsClient.getMilitaryCampaigns() returns { campaigns }, getMilitaryCampaignObjectives() and getCharacterMilitaryCampaignObjectives() return { objectives, cursor }, and campaign and objective fields are renamed to ESI's: campaign_id/objective_id -> id, start_time -> started, finish_time -> finished, committed -> is_committed, contribution -> contributed. These routes answered 404 before the default compatibility date reached 2026-08-18, so no working call changes shape.
* **core:** requests that do not set compatibilityDate now ask ESI for its 2026-08-18 behaviour instead of 2026-05-19. Routes whose response changed between those dates return the newer shape. To keep the old behaviour, pass `compatibilityDate: '2026-05-19'` to the EsiClient config.
* **schemas:** SkyhooksClient.getRaidableSkyhooks() resolves to RaidableSkyhooksResponse ({ skyhooks: RaidableSkyhook[] }) instead of RaidableSkyhook[], and RaidableSkyhook/RaidableSkyhookSchema now have planet_id, solar_system_id and theft_vulnerability { start, end } in place of structure_id, system_id, corporation_id, alliance_id, is_raidable and raidable_at. The old method threw on every live call, so no working code depended on it. Migrate by reading `.skyhooks` from the result and treating a skyhook as raidable while now is between theft_vulnerability.start and .end. TestDataFactory.createRaidableSkyhook builds the new shape; RaidableSkyhooksResponseSchema is new.

### Added

* **charter:** audit CHARTER.md's requirement blocks like feature files ([#485](https://github.com/lgriffin/ESI.ts/issues/485)) ([33c9a87](https://github.com/lgriffin/ESI.ts/commit/33c9a87b4cc85d42ec875b4df89530af5d1bb7ad))
* **ci:** nightly live-health smoke against Tranquility with an authenticated route ([#539](https://github.com/lgriffin/ESI.ts/issues/539)) ([4fa9913](https://github.com/lgriffin/ESI.ts/commit/4fa99131afea7e20c36587eb13ad856ef87bd0b9))
* **client:** add the four missing CustomEsiClient getters ([b5c9672](https://github.com/lgriffin/ESI.ts/commit/b5c9672523064b1bdd6a454b9df4a4853d3b90b6))
* **client:** add the four missing CustomEsiClient getters ([3ddff8f](https://github.com/lgriffin/ESI.ts/commit/3ddff8fcc96ffad17f9c258de95e7b7369600bf2)), closes [#267](https://github.com/lgriffin/ESI.ts/issues/267)
* **client:** deprecate EsiApiFactory's named methods and EsiTokenManager.createClient ([0556eda](https://github.com/lgriffin/ESI.ts/commit/0556edaa77b0ccdf7bcab4da95ed48acf9e7332b))
* **client:** deprecate EsiApiFactory's named methods and EsiTokenManager.createClient ([2ec309d](https://github.com/lgriffin/ESI.ts/commit/2ec309dd4d1b0dd79bda157146dac0e48c696951))
* **client:** one shared runtime with a public view and per-identity views ([#472](https://github.com/lgriffin/ESI.ts/issues/472)) ([a8facde](https://github.com/lgriffin/ESI.ts/commit/a8facded382c3cb20d5e63e64ab0033f7b1c5f0b))
* **client:** per-client tenant (X-Tenant) and user agent options ([75c3e9c](https://github.com/lgriffin/ESI.ts/commit/75c3e9cf19d53ddb61a0bcc95db3c76eb9efa2f3))
* **client:** per-client tenant (X-Tenant) and user agent options ([d006387](https://github.com/lgriffin/ESI.ts/commit/d00638705f2ec9e83ed831520956ff4b78000f2b))
* **ears:** list the exclusion register in the EARS report ([#484](https://github.com/lgriffin/ESI.ts/issues/484)) ([749d428](https://github.com/lgriffin/ESI.ts/commit/749d428c2af51fa3aceb850d3cce8f238cabb78e))
* **errors:** every pipeline failure is a typed EsiError ([61cbc30](https://github.com/lgriffin/ESI.ts/commit/61cbc30c61b7051c0edff7741684469d08b4917e)), closes [#295](https://github.com/lgriffin/ESI.ts/issues/295) [#266](https://github.com/lgriffin/ESI.ts/issues/266)
* **generator:** scope tree generated from path prefixes ([519c945](https://github.com/lgriffin/ESI.ts/commit/519c9456bc3315e0dffdc8ae243e097822e77b60))
* **generator:** scope tree generated from path prefixes ([d83497e](https://github.com/lgriffin/ESI.ts/commit/d83497e332a325b51174add8e4e1fd855a011e56))
* **logger:** accept 'silent' for EsiClientConfig.logLevel ([518ca9b](https://github.com/lgriffin/ESI.ts/commit/518ca9bbe4e2ac20bf1c4d6b6d70ab28d622f2df))
* **logger:** redact URLs at the logger and route every line to the per-client logger ([50231fc](https://github.com/lgriffin/ESI.ts/commit/50231fc6c7263f979fc6dfb0a9a639504fcc4782))
* **logger:** route every pipeline log line to the per-client logger ([ca872a7](https://github.com/lgriffin/ESI.ts/commit/ca872a75c56c8b62525b0615d334b37daec6a14d)), closes [#296](https://github.com/lgriffin/ESI.ts/issues/296)
* **military-campaigns:** page through objective listings with after, before and limit ([01ecc40](https://github.com/lgriffin/ESI.ts/commit/01ecc40fd6c1961347612f319e98d2fc82165827))
* require Node 22 ([3709c39](https://github.com/lgriffin/ESI.ts/commit/3709c3909124456d8d3b8d2452233ee8b56201ec))
* **schemas:** validate every mutation that returns a body ([de93571](https://github.com/lgriffin/ESI.ts/commit/de935717ddf81a98c3d421d2e8fbb5b54fa8417c))
* **schemas:** validate every mutation that returns a body ([81a2e6b](https://github.com/lgriffin/ESI.ts/commit/81a2e6b89f073c8a18d22ff5f7528b287d1ed47e)), closes [#298](https://github.com/lgriffin/ESI.ts/issues/298)
* **sde:** inject the clock, mutate src/sde in its own shards and seed its floors ([#508](https://github.com/lgriffin/ESI.ts/issues/508)) ([18d69cc](https://github.com/lgriffin/ESI.ts/commit/18d69cccaa984725c880f3d643a6c2254e102306)), closes [#448](https://github.com/lgriffin/ESI.ts/issues/448)
* **testing:** createMockTransport for an application's own tests ([#478](https://github.com/lgriffin/ESI.ts/issues/478)) ([7982482](https://github.com/lgriffin/ESI.ts/commit/7982482d2e030ff05f3f58350e3793f63a557909))
* **types:** accept undefined in the remaining option bags ([6fc5033](https://github.com/lgriffin/ESI.ts/commit/6fc5033428958e441f591829e37954d6a0e9da54))
* **types:** compile src with exactOptionalPropertyTypes ([d2aa0bb](https://github.com/lgriffin/ESI.ts/commit/d2aa0bb1e949e59978a280efd8a25e78bdfbc73d))
* **types:** compile src with exactOptionalPropertyTypes ([56dbd0a](https://github.com/lgriffin/ESI.ts/commit/56dbd0a8c1c70e34e239347179871b06de7bc254))


### Fixed

* **adapters:** reject a non-finite query number before sending it ([3740c44](https://github.com/lgriffin/ESI.ts/commit/3740c4416a296bf8caf2f37235425c3a23abc589))
* **ci:** close a drift PR only after a clean run that contradicts it ([85fec83](https://github.com/lgriffin/ESI.ts/commit/85fec832671fd97369b37b455080dcfc44718810))
* **clients:** refuse a text endpoint in the page helpers ([2976cb0](https://github.com/lgriffin/ESI.ts/commit/2976cb0ae75be55ade8227fcec2513448bd4701a))
* **client:** validate tenant and user agent in their setters ([1f67db9](https://github.com/lgriffin/ESI.ts/commit/1f67db907c777b1cd82d678b35fc487abef16cbb))
* **contracts:** resolve public items and bids with [] when ESI sends no content ([cab591b](https://github.com/lgriffin/ESI.ts/commit/cab591bb14547d040a7e002a054a4e17af978142))
* **contracts:** resolve public items and bids with [] when ESI sends no content ([8800141](https://github.com/lgriffin/ESI.ts/commit/8800141fc7cd7abb97d1bde21ec35dffcdb033bb)), closes [#433](https://github.com/lgriffin/ESI.ts/issues/433)
* **contract:** stop flagging optional fields as payload drift ([8c5c0a2](https://github.com/lgriffin/ESI.ts/commit/8c5c0a24ebf1d866cf5d5eb1fa4e30a70cb1d4f2))
* **contract:** stop flagging optional fields as payload drift ([c6d0f2d](https://github.com/lgriffin/ESI.ts/commit/c6d0f2d6957ba4f88a5acfb0ae308316111b8789))
* **core:** key the ETag cache and deduplicator by character, not by token ([#465](https://github.com/lgriffin/ESI.ts/issues/465)) ([e68bdd5](https://github.com/lgriffin/ESI.ts/commit/e68bdd54ae54e6f27754b605694e115df5130bbe))
* **core:** pagination retries use the caller's method; cursor fetchAll rejects instead of truncating ([deb7934](https://github.com/lgriffin/ESI.ts/commit/deb7934b49947af30f9ae2245c70cd0b15ad9d88))
* **core:** pagination retries use the caller's method; cursor fetchAll rejects instead of truncating ([913631d](https://github.com/lgriffin/ESI.ts/commit/913631d3f499b836b77319a55efe261aa21f8e0f))
* **core:** send compatibility date 2026-08-18 by default ([ed9cc76](https://github.com/lgriffin/ESI.ts/commit/ed9cc763446997b012a53f8bd7cd9e6e194378f7))
* **core:** send streamed and fetch-all pages without If-None-Match ([b734a5d](https://github.com/lgriffin/ESI.ts/commit/b734a5d02b06f917e1cd7d65d1b9f26e16764e1f))
* **core:** send streamed and fetch-all pages without If-None-Match ([624b87b](https://github.com/lgriffin/ESI.ts/commit/624b87bbe35a5ccd504db41d61ccd24bedd50d56)), closes [#292](https://github.com/lgriffin/ESI.ts/issues/292)
* **deps:** move the better-sqlite3 dev dependency to 13 so Node 24 runs ([e01d858](https://github.com/lgriffin/ESI.ts/commit/e01d85895567e37a7f416a1785e4bb24f41edb01))
* **docs:** escape backslashes before pipes in example index cells ([4d536d3](https://github.com/lgriffin/ESI.ts/commit/4d536d315ff39833d31d0fe36bd77266bc177bd1))
* **docs:** list only real client calls and make the quick start runnable ([c2ea722](https://github.com/lgriffin/ESI.ts/commit/c2ea7229d476a439360d59e72384a6395ca7257b))
* **docs:** require the readme version marker and mask indented code ([4ee29e2](https://github.com/lgriffin/ESI.ts/commit/4ee29e28d74e3eb7c57016a9dea4b79f0e08feb2))
* **ears:** name the audit in the result line and widen the workflow paths ([2771a00](https://github.com/lgriffin/ESI.ts/commit/2771a00fe03ea93976ac78e1863dc301b8dbed92))
* **factory:** apply compatibilityDate to EsiApiFactory clients ([4e3fafc](https://github.com/lgriffin/ESI.ts/commit/4e3fafcce912126dbfdfcaee1b2a7ddabbacd712))
* **factory:** apply compatibilityDate to EsiApiFactory clients ([9686f6c](https://github.com/lgriffin/ESI.ts/commit/9686f6c936299fc750f1af169de06f9ab5f420af))
* **layout:** name the moved Stryker config in docs; check config/ script targets ([5f4606d](https://github.com/lgriffin/ESI.ts/commit/5f4606d7acc8b32eb7d136398e2881859fc450da))
* **logger:** build the lazy default logger once for saved methods ([856eb19](https://github.com/lgriffin/ESI.ts/commit/856eb19f0a81cfe461f13c21b907eeef1bfeb913))
* **logger:** redact query pairs in place, and the token manager's lines ([8efe745](https://github.com/lgriffin/ESI.ts/commit/8efe74540caf1b737d511bc7f7884d2e31fe05af)), closes [#296](https://github.com/lgriffin/ESI.ts/issues/296)
* **logger:** redact sensitive query parameters at the logger boundary ([91b9bbb](https://github.com/lgriffin/ESI.ts/commit/91b9bbbbeabf2403f493f0e22fd81e2b8b1f5a74)), closes [#296](https://github.com/lgriffin/ESI.ts/issues/296)
* **logger:** resolve the token manager's fallback logger at each call ([94fb313](https://github.com/lgriffin/ESI.ts/commit/94fb3139efff2a9c89c956151aefe5053530ef8e)), closes [#296](https://github.com/lgriffin/ESI.ts/issues/296)
* **mutation:** re-run the mutants a changed or deleted test covered ([#499](https://github.com/lgriffin/ESI.ts/issues/499)) ([afead13](https://github.com/lgriffin/ESI.ts/commit/afead130fb2c3d5213e5aefbb3ad1fd3c3792625))
* **mutation:** run the BDD dry run over every spec so step-library domains are scored ([#523](https://github.com/lgriffin/ESI.ts/issues/523)) ([fb4a210](https://github.com/lgriffin/ESI.ts/commit/fb4a2109bc1e98bfa0ecfde9961a29e1ac0666d8))
* **release:** drop a merge line only when its twin commit is listed ([4301db1](https://github.com/lgriffin/ESI.ts/commit/4301db1da60a3751a91b0571486785bb9ece654c))
* **schemas:** match getRaidableSkyhooks to the response ESI sends ([63115d6](https://github.com/lgriffin/ESI.ts/commit/63115d628481ac504bea1d9d9104b6cf2e27215c))
* **schemas:** match the responses ESI sends at compatibility date 2026-08-18 ([ee3e2f4](https://github.com/lgriffin/ESI.ts/commit/ee3e2f45e584fac3e663626c32522454baca5cff))
* **schemas:** require one of tax_rate or tax_rates on CorporationInfo ([2351c79](https://github.com/lgriffin/ESI.ts/commit/2351c79e63a86b2a6346f0955f3e74aa2c9f2f0b))
* **schemas:** return meta.getChangelog as ESI sends it ([b8ed1e4](https://github.com/lgriffin/ESI.ts/commit/b8ed1e42ea0fa50c29d6ff018cb9b3a1fe27bb3f))
* **sde:** return whole tables and foreign-key lists ordered by ID ([#516](https://github.com/lgriffin/ESI.ts/issues/516)) ([0ea8251](https://github.com/lgriffin/ESI.ts/commit/0ea8251e6b60b83f6df2c67966fd54f66717c2c3))
* **sde:** take the dogma ids from the record keys and fix the industry example ([#533](https://github.com/lgriffin/ESI.ts/issues/533)) ([9df53ee](https://github.com/lgriffin/ESI.ts/commit/9df53ee4017e2a91bc13a70c441809ee4814efb3))
* **security:** reject `.` and `..` as path parameters ([706dfcc](https://github.com/lgriffin/ESI.ts/commit/706dfcc1901159a37e032a095b25555f44b8125a))
* **security:** reject `.` and `..` as path parameters ([4ed42b1](https://github.com/lgriffin/ESI.ts/commit/4ed42b15b57683d42f9716e71aa75eae3e54e090))
* **validation:** reject path params whose string form is empty ([a98e7e1](https://github.com/lgriffin/ESI.ts/commit/a98e7e18235641a88b6bb44fbef75d58b6a0b90f))


### Changed

* **adapters:** back the generated operations with the request pipeline ([9550e75](https://github.com/lgriffin/ESI.ts/commit/9550e75355a4c167c8823cd73ca26cffbe619954))
* **adapters:** back the generated operations with the request pipeline ([33ec520](https://github.com/lgriffin/ESI.ts/commit/33ec5208062f333dc3c086df02218767aa92fc7e))
* **api:** regenerate the API report after merging master ([4571b88](https://github.com/lgriffin/ESI.ts/commit/4571b880ece64ecd102bd09ff28fa2cde102d623))
* **auth:** let token:create match an application's own localhost callback path ([#544](https://github.com/lgriffin/ESI.ts/issues/544)) ([e4daf98](https://github.com/lgriffin/ESI.ts/commit/e4daf9896cabf0d8a88112e610c9c91d0478ce34))
* **beads:** close the beads that GitHub and master have already settled ([8700309](https://github.com/lgriffin/ESI.ts/commit/8700309248f569a57fdc8fe38e80dc087f9f1d96))
* **beads:** close the beads that GitHub and master have already settled ([65ac0ca](https://github.com/lgriffin/ESI.ts/commit/65ac0ca581af567f5be48400e72166448499737e))
* **beads:** export issues.jsonl automatically after bd writes ([c171c72](https://github.com/lgriffin/ESI.ts/commit/c171c727cca6ce47d7e96ab73e083a83fe40a2a5))
* **beads:** export issues.jsonl automatically after bd writes ([8784b95](https://github.com/lgriffin/ESI.ts/commit/8784b95653cfc8c18f86110347d2d8a2a922c42d)), closes [#245](https://github.com/lgriffin/ESI.ts/issues/245)
* **ci:** make the pull-request mutation job advisory until the release gate ([#477](https://github.com/lgriffin/ESI.ts/issues/477)) ([60f07d5](https://github.com/lgriffin/ESI.ts/commit/60f07d59fd29bef16bdd35bdf3d14ab209061acb))
* **core:** add the TokenProvider, CacheStore, Logger, Clock and HttpTransport ports ([5d0296c](https://github.com/lgriffin/ESI.ts/commit/5d0296cda6e1b625049b509a13f3d83413b5acb3))
* **core:** add the TokenProvider, CacheStore, Logger, Clock and HttpTransport ports ([38c106c](https://github.com/lgriffin/ESI.ts/commit/38c106c72a589007cd364793175c9909c2939815))
* **core:** empty the layer baseline ([#480](https://github.com/lgriffin/ESI.ts/issues/480)) ([3095682](https://github.com/lgriffin/ESI.ts/commit/30956826cf5ee5652841843f20f15deb5773b108))
* **core:** remove the unreachable logger module and unused pipeline re-exports ([c5baf4d](https://github.com/lgriffin/ESI.ts/commit/c5baf4d06e8d221cd0bd3f3a2022f81034efa036))
* **deps:** bump astral-sh/setup-uv from 10.0.1 to 10.2.0 ([#438](https://github.com/lgriffin/ESI.ts/issues/438)) ([5d8cf3e](https://github.com/lgriffin/ESI.ts/commit/5d8cf3e447064d6c74d7795342c3773bec8db13d))
* **deps:** bump size-limit, @size-limit/esbuild and @size-limit/file to 13.0.3 ([9995662](https://github.com/lgriffin/ESI.ts/commit/99956625c5e0847e3f43fb557c7cff4cfb016777))
* **deps:** bump the minor group with 6 updates ([#436](https://github.com/lgriffin/ESI.ts/issues/436)) ([af26529](https://github.com/lgriffin/ESI.ts/commit/af2652980d70e067eebe411e6b66b736c38360b2))
* **deps:** pin the local Prism mock and give the fuzz run its own network ([b8eaf66](https://github.com/lgriffin/ESI.ts/commit/b8eaf66475638246159423961803b2ab8fafa8af))
* **deps:** remove unused devDependencies ([4510bfa](https://github.com/lgriffin/ESI.ts/commit/4510bfa9aa408216a4e9ee0fa18bb2f40e00c100))
* **deps:** run Prism from its Docker image and drop @stoplight/prism-cli ([db8e36c](https://github.com/lgriffin/ESI.ts/commit/db8e36cac59dc3ed82107ff0e82c7fb3a5b4a2aa))
* **docs:** strip heading tags to a fixed point in the slug helper ([139be4d](https://github.com/lgriffin/ESI.ts/commit/139be4dc0e2d9aad232f8412e4d13510fee99706))
* **layout:** drop formatting-only edits from the scripts move ([6228a4f](https://github.com/lgriffin/ESI.ts/commit/6228a4fe20fa3cc49df1d01f08c16a85de5f9fd7))
* **layout:** drop the spec-audit old-path fallback ([b60cd9b](https://github.com/lgriffin/ESI.ts/commit/b60cd9ba890cc4578171000ef942ddf979397f40))
* **layout:** drop the spec-audit old-path fallback ([12f6f9c](https://github.com/lgriffin/ESI.ts/commit/12f6f9c820e59cc1d2e53915a0deb4a6145adc1d))
* **layout:** keep unrelated files byte-identical to master ([3d2273f](https://github.com/lgriffin/ESI.ts/commit/3d2273f3ddd8de116d23e5388baf6bd778ce98b0))
* **layout:** move Jest configs to config/jest/ and test setup to tests/setup/ ([ece3ced](https://github.com/lgriffin/ESI.ts/commit/ece3ceda09d115d378c696a50335b06959f178ec))
* **layout:** move Jest configs to config/jest/ and test setup to tests/setup/ ([04151d6](https://github.com/lgriffin/ESI.ts/commit/04151d69be480d2d958bc1a22ba41c9afcf789b5))
* **layout:** move lint rule configs to config/eslint/ ([6cdbbd9](https://github.com/lgriffin/ESI.ts/commit/6cdbbd9e123adf124abfeeb26d1772d1a06be573))
* **layout:** move lint rule configs to config/eslint/ ([f4043d6](https://github.com/lgriffin/ESI.ts/commit/f4043d629ea9865ec73ade057d01e10d32e252a8))
* **layout:** move root types/ to tests/types/; archive the v7 OpenAPI output doc ([da024f4](https://github.com/lgriffin/ESI.ts/commit/da024f4a60b91e418d0f0d918f3f20d23ed23b27))
* **layout:** move root types/ to tests/types/; archive the v7 OpenAPI output doc ([7bfa83a](https://github.com/lgriffin/ESI.ts/commit/7bfa83a67beee8de04c7d79431e296e906953850))
* **layout:** move Stryker configs and mutation floors to config/mutation/ ([4f071db](https://github.com/lgriffin/ESI.ts/commit/4f071dbb2f037c3f6832914b3bef4496cc0d2477))
* **layout:** move Stryker configs and mutation floors to config/mutation/ ([8ae9bdb](https://github.com/lgriffin/ESI.ts/commit/8ae9bdb159b16081a7778326ebf665fe6e785cfb))
* **layout:** split scripts/ into folders by job ([2c7e3e1](https://github.com/lgriffin/ESI.ts/commit/2c7e3e1ccdf3ab26d8b5d4e888826e779b6496c6))
* **layout:** split scripts/ into folders by job ([7be688b](https://github.com/lgriffin/ESI.ts/commit/7be688b3aa228ef2e8a8f0b1faf5a980a28e7c96))
* **lint:** enforce SDE isolation in both directions ([#462](https://github.com/lgriffin/ESI.ts/issues/462)) ([3d57e80](https://github.com/lgriffin/ESI.ts/commit/3d57e80dd0cc1d15129843a2940e3fdbacb18a1c))
* **logger:** build no pino logger at import; declare sideEffects false ([f7c5ce9](https://github.com/lgriffin/ESI.ts/commit/f7c5ce9575dfd460f99b80407f00e4bfaf49861d))
* **logger:** build no pino logger at import; declare sideEffects false ([25c21d7](https://github.com/lgriffin/ESI.ts/commit/25c21d70ac9daf88044c7b30c691298ccdf8303c)), closes [#268](https://github.com/lgriffin/ESI.ts/issues/268)
* **logger:** skip a disabled level before redacting the line ([a21a283](https://github.com/lgriffin/ESI.ts/commit/a21a283541788cab0291b6bc2ce2923afc5b4311)), closes [#296](https://github.com/lgriffin/ESI.ts/issues/296)
* **meta:** route getOpenApiYaml through the request pipeline ([ba87016](https://github.com/lgriffin/ESI.ts/commit/ba87016e4aa6f40ac4cbd31e0d7e87246b92ec2f))
* **meta:** route getOpenApiYaml through the request pipeline ([e06089e](https://github.com/lgriffin/ESI.ts/commit/e06089e6ef0d53bba44ae1846b911d0616e76d7b))
* **mutation:** exclude interface-only src/core/ports from unit mutation ([397c19b](https://github.com/lgriffin/ESI.ts/commit/397c19b4bb9dcffc81541d424fcd8748c5d1b724))
* **schema-drift:** leave text endpoints out of the drift comparison ([58f5f2a](https://github.com/lgriffin/ESI.ts/commit/58f5f2a84fc873fe90965abe95d43b12586a8816))
* **scripts:** fail validate:auth-scopes in both directions of DES-04 ([4dedff8](https://github.com/lgriffin/ESI.ts/commit/4dedff838482c637a933c5d5a7163458c0ec9d00))
* **sde:** split the module into ports, domain, providers, ingestion and testing ([#527](https://github.com/lgriffin/ESI.ts/issues/527)) ([1a08e19](https://github.com/lgriffin/ESI.ts/commit/1a08e19cdd18e6026dded276ea708827f66c3eb6))
* **security:** record the Scorecard at 8.3 and move the two checks the repository still could ([#541](https://github.com/lgriffin/ESI.ts/issues/541)) ([dd80b06](https://github.com/lgriffin/ESI.ts/commit/dd80b0676fa9dc52dab4684ee583690d637ece5e))
* **size:** raise the . budget to the size master has grown to ([4b08f3b](https://github.com/lgriffin/ESI.ts/commit/4b08f3b1ffc034fd4313ea82e86b9582e2139361))
* **size:** raise the . budget to the size master has grown to ([de48154](https://github.com/lgriffin/ESI.ts/commit/de48154119f72a653fc005572de409460581e50c))
* **size:** raise the ./schemas budget for the 2026-08-18 schemas ([579cbaa](https://github.com/lgriffin/ESI.ts/commit/579cbaa47a62c6a07e0f4f9efda65efe035adb0a))
* **skills:** bump ears-gherkin-dev to 1.0.1 for the Jest config path change ([289d966](https://github.com/lgriffin/ESI.ts/commit/289d966521cda408dce975aa9e54b60de5144c57))
* **skills:** bump ears-gherkin-dev version for moved script paths ([46b788c](https://github.com/lgriffin/ESI.ts/commit/46b788cc290f05ecd8673064a8afeccbac6e90c7))
* **spec:** fetch the vendored spec at COMPATIBILITY_DATE from CI ([273b4a5](https://github.com/lgriffin/ESI.ts/commit/273b4a5af51c325f023cbbebb3fc11ac8bb1641a))
* **spec:** gate IStaticDataProvider method coverage against the EARS specification ([#512](https://github.com/lgriffin/ESI.ts/issues/512)) ([d37ee05](https://github.com/lgriffin/ESI.ts/commit/d37ee0587eed5ecbd98474caf03d83bcded8f2ef))
* **spec:** generate typed operations for every ESI route from the vendored spec ([a69013e](https://github.com/lgriffin/ESI.ts/commit/a69013e414a827c6642335252da0483678869fd6))
* **spec:** generate typed operations for every ESI route from the vendored spec ([26ed8cf](https://github.com/lgriffin/ESI.ts/commit/26ed8cff74330e351d35d5b622bbcb8924e634e2))
* **spec:** generate types from the vendored snapshot in spec-refresh ([9d5264f](https://github.com/lgriffin/ESI.ts/commit/9d5264fa0bea76ef63af4fc57c9aa38daba53544))
* **spec:** record each operation's header parameters in its Meta ([259e60c](https://github.com/lgriffin/ESI.ts/commit/259e60c6eb11b99878c712a618e0e50afcf82663))
* **spec:** reject bad snapshot arguments and skip superseded refreshes ([ae7a58e](https://github.com/lgriffin/ESI.ts/commit/ae7a58e86c88e57b6892ebb81b4d70f2609a61fc))
* **spec:** vendor the ESI spec at 2026-05-19 and regenerate operations ([bc011ff](https://github.com/lgriffin/ESI.ts/commit/bc011ff7becd00356314c32ebe1af01e4c3209c0))
* **spec:** vendor the ESI spec at 2026-08-18 and regenerate from it ([252ca74](https://github.com/lgriffin/ESI.ts/commit/252ca749658c393ec18f2cd5773b85828157278c))
* **spec:** vendor the ESI spec at 2026-08-18 and regenerate from it ([797794c](https://github.com/lgriffin/ESI.ts/commit/797794c7aef9d535d02140843d7fdb50c018507d))
* **spec:** vendor the ESI spec at the date the client sends, fetched by CI ([73fd955](https://github.com/lgriffin/ESI.ts/commit/73fd9556624d35076849dedea0c8f35ad983c1bd))
* **types:** check isolatedDeclarations over the layers 11.0 exposes ([#482](https://github.com/lgriffin/ESI.ts/issues/482)) ([5c7a3b0](https://github.com/lgriffin/ESI.ts/commit/5c7a3b0a6e028db49df82c34f22cadc5ab0f5188))


### Documentation

* add the Phase 0 audit of code origin, operation coverage and gates ([6cf5a6e](https://github.com/lgriffin/ESI.ts/commit/6cf5a6e4f0ac00874257322d769ec8d08f6aecef))
* add the Phase 0 generator spike over five spec operations ([29113be](https://github.com/lgriffin/ESI.ts/commit/29113beb9b14e745287eb01ebac2a0cef71ceca9))
* **audit:** re-check route coverage against the spec at 2026-05-19 ([5dfc0a4](https://github.com/lgriffin/ESI.ts/commit/5dfc0a46863ff07828258c08f5f2e5baf3ede1ec))
* **auth:** check the SSO state, hash rate-limit keys, fix example names ([10c862d](https://github.com/lgriffin/ESI.ts/commit/10c862dc6bc08e2a84c7a37b20ac5c858f708b25))
* bring the README, guides and testing docs up to the measured state ([7873ad0](https://github.com/lgriffin/ESI.ts/commit/7873ad04cccda8d26d808ce45edc8c2c1a593a28))
* bring the README, guides and testing docs up to the measured state ([38d5e19](https://github.com/lgriffin/ESI.ts/commit/38d5e1922b83ce4cbbc878a2e22644273cf33dd5))
* build and deploy the documentation site at lgriffin.github.io/ESI.ts ([ae99caf](https://github.com/lgriffin/ESI.ts/commit/ae99caf472cea4c41b4d4da05b8e1f0214f99cc5))
* **changelog:** backfill every version number from 8.0.0 to 9.9.0 ([9016266](https://github.com/lgriffin/ESI.ts/commit/90162661dd6551764ddd7a7278febf213a160007))
* **changelog:** backfill every version number from 8.0.0 to 9.9.0 ([2909278](https://github.com/lgriffin/ESI.ts/commit/2909278255a4f73711e2e6d9732dcdc3fd692afa)), closes [#275](https://github.com/lgriffin/ESI.ts/issues/275)
* **changelog:** keep the entries the stricter rule keeps ([f8ce01c](https://github.com/lgriffin/ESI.ts/commit/f8ce01c3de78c217b1aa2d3a1f379e7fbc13611f))
* **changelog:** remove the lines merge commits repeated in 10.x ([4e1595a](https://github.com/lgriffin/ESI.ts/commit/4e1595ab9e2a5ce700cdae54d719679ba217996c)), closes [#377](https://github.com/lgriffin/ESI.ts/issues/377)
* **charter:** link the dot-segment fix from gap register row 29 ([1686546](https://github.com/lgriffin/ESI.ts/commit/1686546e52eee8b8c3f9f79c6bd65b4c1a92ef6c))
* **charter:** mark TEST-09 enforced now that npm run lint covers tests/ ([92dbb12](https://github.com/lgriffin/ESI.ts/commit/92dbb12c34ac75a31090ccaa1b188b88ebc08bfc))
* **charter:** publish revision 2 for the 11.0 plan ([60b4b9b](https://github.com/lgriffin/ESI.ts/commit/60b4b9b33491ce5d87917201335db19b14225fa8))
* **charter:** publish revision 2 for the 11.0 plan ([c0a7af5](https://github.com/lgriffin/ESI.ts/commit/c0a7af5c127aacbbf362fa316da31cc5deeaeda0)), closes [#299](https://github.com/lgriffin/ESI.ts/issues/299)
* **charter:** record the EARS governance decisions for 11.0.0 ([#469](https://github.com/lgriffin/ESI.ts/issues/469)) ([f806afa](https://github.com/lgriffin/ESI.ts/commit/f806afac96b1862b50a6462062548ab23c057e51))
* **charter:** state the determinism baseline and how recorded-payload drift reports ([45fadaa](https://github.com/lgriffin/ESI.ts/commit/45fadaa82e778aaf09a72a870dc70072dcfcc71e))
* **examples:** find the Rifter blueprint by its product in the industry example ([#536](https://github.com/lgriffin/ESI.ts/issues/536)) ([1ebb168](https://github.com/lgriffin/ESI.ts/commit/1ebb16869fc85908ac2573ff4f0fc34ccbe4c1b3))
* generate the counts the documentation quotes ([5f76437](https://github.com/lgriffin/ESI.ts/commit/5f764371e94b643cfa38601768df0491c9f7f1e4))
* generate the counts the documentation quotes ([91b27d4](https://github.com/lgriffin/ESI.ts/commit/91b27d4feab9cf0a64e38a5fa934437b43f3998d))
* generate the documentation site from guides and examples ([f47ee69](https://github.com/lgriffin/ESI.ts/commit/f47ee69bbad583704cacea9d8c4d0998dfb0006e))
* **guides:** add the Lean decision record, v7 to 11.0 ([439ee85](https://github.com/lgriffin/ESI.ts/commit/439ee8510a3ebe15c173682f34810a9b9da903bc))
* **guides:** add the Lean decision record, v7 to 11.0 ([d089c05](https://github.com/lgriffin/ESI.ts/commit/d089c05c2746f8d66fd5251aed15e0367f5be7dc))
* **layout:** point remaining script paths at their new folders ([308def6](https://github.com/lgriffin/ESI.ts/commit/308def6241e2549b0b9a61dec1b5919307119f49))
* **logging:** every call site uses the per-client logger, held by lint ([3169a98](https://github.com/lgriffin/ESI.ts/commit/3169a9881c62132862988e9061228280c78d8ce0))
* **logging:** record that nothing is built at import; ARCH-06 Enforced ([28f17b9](https://github.com/lgriffin/ESI.ts/commit/28f17b9c830889ceac04d29b38a1fdcc6b671024))
* make the spike's compiler check reproducible and complete the audit baseline ([e0b836d](https://github.com/lgriffin/ESI.ts/commit/e0b836d9f32f1ed81b7a09c5b27eab044c30271a))
* metrics refreshed. ([cfd04b3](https://github.com/lgriffin/ESI.ts/commit/cfd04b36178b1817ae24a49523e31a8364cec9ce))
* **mutation:** re-run with --force when a strengthened test should kill a survivor ([25b1b4b](https://github.com/lgriffin/ESI.ts/commit/25b1b4b6c8f7f8f7e827861ae32e712b4d24b05d))
* **mutation:** re-run with --force when a strengthened test should kill a survivor ([e5b1622](https://github.com/lgriffin/ESI.ts/commit/e5b1622ad4370960da779b0425f075f92b2c3ed2)), closes [#380](https://github.com/lgriffin/ESI.ts/issues/380)
* note the 11.0 deprecations of the factory methods and createClient ([d852ab9](https://github.com/lgriffin/ESI.ts/commit/d852ab97c77982d5db8751ff29ad668fedc4722a))
* Phase 0 audit and generator spike ([391fba1](https://github.com/lgriffin/ESI.ts/commit/391fba1772620ab7fd4b8200e28e0b0082003725))
* **ports:** describe CacheStore ttl as retention, not freshness ([0641466](https://github.com/lgriffin/ESI.ts/commit/064146646aa08869902f0f5166d7c6810dcb0ed6))
* **quality-gates:** record the mutation and api-fuzz nightly issues ([c8d922c](https://github.com/lgriffin/ESI.ts/commit/c8d922c44a35a073f82e5b58de6fefcdaa9e9ab2)), closes [#277](https://github.com/lgriffin/ESI.ts/issues/277)
* **readme:** point the mutation row at the testing guide after merging master ([c329a3d](https://github.com/lgriffin/ESI.ts/commit/c329a3dd0239bcfecb65c0646a654a11af8fde1d))
* **readme:** put the measured test, coverage, mutation and Scorecard numbers up front ([#540](https://github.com/lgriffin/ESI.ts/issues/540)) ([8f5e5cf](https://github.com/lgriffin/ESI.ts/commit/8f5e5cfc2ed037740b888952a82d55e30da4eabd))
* record the documentation site in the charter, roadmap and guides ([cf69d6d](https://github.com/lgriffin/ESI.ts/commit/cf69d6db69357a74789953c7721905b305723de1))
* **release:** charter revision 3, Track S in the gate, and the 10.x end date ([#535](https://github.com/lgriffin/ESI.ts/issues/535)) ([7cfe139](https://github.com/lgriffin/ESI.ts/commit/7cfe139fd2f4126b3588f6e3cc2f3bded264d29d))
* **roadmap:** close Phase 4 and add Track S Run 12, the SDE clean architecture ([#495](https://github.com/lgriffin/ESI.ts/issues/495)) ([4f677b5](https://github.com/lgriffin/ESI.ts/commit/4f677b5c410a42b6f09ce6ad8bfaea549ab108d7))
* **roadmap:** mark Phase 3 done ([#483](https://github.com/lgriffin/ESI.ts/issues/483)) ([f7861fb](https://github.com/lgriffin/ESI.ts/commit/f7861fbb00efe774bdce63ee079ba5df3261cb68))
* **roadmap:** mark Phase 5 item 2 done in both landed notes ([69d1872](https://github.com/lgriffin/ESI.ts/commit/69d187210c4e28eb73b10e3218bc8d45c2c69be9))
* **roadmap:** mark phases 5 and 7 met on the 11.0.0 release gate ([c874a18](https://github.com/lgriffin/ESI.ts/commit/c874a1898d71a8c8332e420580f9f4ee6dc424e1))
* **roadmap:** mark phases 5 and 7 met on the 11.0.0 release gate ([aefa075](https://github.com/lgriffin/ESI.ts/commit/aefa075a2d7c49e221745075ae21c6f4abacc8fb))
* **roadmap:** mark the last three release-gate rows met ([#550](https://github.com/lgriffin/ESI.ts/issues/550)) ([8993558](https://github.com/lgriffin/ESI.ts/commit/8993558eafd2f758b42668a1576456af91cb57dd))
* **roadmap:** publish the Road to 11.0.0 plan with the SDE programme ([f14459c](https://github.com/lgriffin/ESI.ts/commit/f14459c359a0c464d823ede371e7e59630d369f7))
* **roadmap:** publish the Road to 11.0.0 plan with the SDE programme ([9c65c38](https://github.com/lgriffin/ESI.ts/commit/9c65c386cccefd745c6ab09d645dd95931840286))
* **roadmap:** record Phase 3 progress and drop isolatedDeclarations ([f6aea30](https://github.com/lgriffin/ESI.ts/commit/f6aea30587aece339ce97408779e8b06e5126efb))
* **roadmap:** record Phase 3 progress and drop isolatedDeclarations ([d58d4d6](https://github.com/lgriffin/ESI.ts/commit/d58d4d6844545b467b76aae70016b015414b96d4))
* **roadmap:** state the release gate as a table and Phase 7 docs work as future ([a0bf92d](https://github.com/lgriffin/ESI.ts/commit/a0bf92df38c32cb2d5b0cf2b774e414a9ce76349))
* **roadmap:** take maintainer settings and nightlies off the 11.0.0 release gate ([00456a7](https://github.com/lgriffin/ESI.ts/commit/00456a793373986b99c518458d3419fcd609acdc))
* **roadmap:** take maintainer settings and nightlies off the 11.0.0 release gate ([85f71dc](https://github.com/lgriffin/ESI.ts/commit/85f71dc8d087e2887c4d4565e667ebd4fe071939))
* **roadmap:** take mutation off the 11.0.0 release gate ([3821ffc](https://github.com/lgriffin/ESI.ts/commit/3821ffc778311e04ea029bf592ec03edea5d769f))
* **roadmap:** take mutation off the 11.0.0 release gate ([4f3289b](https://github.com/lgriffin/ESI.ts/commit/4f3289be82a3df9d73379ed665b149eb8cbdc9fd))
* **sde:** add the SDE guide with C4 architecture ([#463](https://github.com/lgriffin/ESI.ts/issues/463)) ([79b7a88](https://github.com/lgriffin/ESI.ts/commit/79b7a886525598a101f221bb8725ea673c082f10))
* **sde:** add the SDE testing scorecard ([#547](https://github.com/lgriffin/ESI.ts/issues/547)) ([ab06f4e](https://github.com/lgriffin/ESI.ts/commit/ab06f4e45eb3786e5ee1091379569e7c125c02b4))
* **sde:** move the SDE doc set to guides/ and record the enforced gates ([#521](https://github.com/lgriffin/ESI.ts/issues/521)) ([0e92049](https://github.com/lgriffin/ESI.ts/commit/0e92049e6aeab27b2156fa57c4d11f2c30c14cb1))
* **security:** record Phase 6's repository side and the maintainer's settings ([092e309](https://github.com/lgriffin/ESI.ts/commit/092e3094a7505331970ce43ecc2ee96c5114d001)), closes [#239](https://github.com/lgriffin/ESI.ts/issues/239) [#270](https://github.com/lgriffin/ESI.ts/issues/270)
* state the Node 22 floor for 11.0.0 ([fff5d2b](https://github.com/lgriffin/ESI.ts/commit/fff5d2bc0e96e23cd47e43611072b91fd507ba58))
* **testing:** fold MUTATION-TESTING.md into TESTING.md ([5c289f3](https://github.com/lgriffin/ESI.ts/commit/5c289f385d713d6c52f036d2654f963f2a86c3f7))
* **testing:** fold MUTATION-TESTING.md into TESTING.md ([aedc678](https://github.com/lgriffin/ESI.ts/commit/aedc678ac1a6368248cb6f635d690cb29f01c145)), closes [#273](https://github.com/lgriffin/ESI.ts/issues/273)
* **testing:** record the fake-timer rule and the re-seed still to run ([4fcd495](https://github.com/lgriffin/ESI.ts/commit/4fcd4950b20896668a5e4a5653424763b7d23160)), closes [#382](https://github.com/lgriffin/ESI.ts/issues/382)


### Testing

* accept both compatibility dates in the drift check and type tests ([62ffa4d](https://github.com/lgriffin/ESI.ts/commit/62ffa4d28cf27fe3a5d625a774dfb784689653fa))
* add standalone EARS requirement check (npm run ears) ([2f52d21](https://github.com/lgriffin/ESI.ts/commit/2f52d21b3adfa42f506cdf1fcc664647d1188ed4))
* add standalone EARS requirement check (npm run ears) ([471ab07](https://github.com/lgriffin/ESI.ts/commit/471ab07d7a74d5900ba85d4386b21c3799645ebb))
* **bdd:** close the peer, nested-log and fetch-all gaps in the exclusion rules ([cfd04b3](https://github.com/lgriffin/ESI.ts/commit/cfd04b36178b1817ae24a49523e31a8364cec9ce))
* **bdd:** convert SDE step definitions to the step library ([#511](https://github.com/lgriffin/ESI.ts/issues/511)) ([8a8656f](https://github.com/lgriffin/ESI.ts/commit/8a8656ffafc42894f7dd8a1a05e2611ee7c15a81)), closes [#449](https://github.com/lgriffin/ESI.ts/issues/449)
* **bdd:** import the SDE test data factory from its new testing folder ([9703828](https://github.com/lgriffin/ESI.ts/commit/9703828a8b31342648a2d26a85d1821fa1d24d2c))
* **bdd:** state every documented exclusion as an unwanted-behaviour rule ([114a485](https://github.com/lgriffin/ESI.ts/commit/114a485ae4d6eab65d55f268801918e71ddc7706))
* **bdd:** state the client's deliberate exclusions as unwanted-behaviour rules ([d9feafc](https://github.com/lgriffin/ESI.ts/commit/d9feafc26eb26a7fe183b61da3e1c23699c19332))
* **bench:** SDE load, lookup and heap benchmarks with nightly trend ([#520](https://github.com/lgriffin/ESI.ts/issues/520)) ([5e1ae57](https://github.com/lgriffin/ESI.ts/commit/5e1ae57aec7292e02d38fc9e5462aec980fdca30))
* **cache:** assert ETag cache expiry and sweeps on a fake clock ([bacc52c](https://github.com/lgriffin/ESI.ts/commit/bacc52c8609fcff702891060621dba24b10bb916)), closes [#382](https://github.com/lgriffin/ESI.ts/issues/382)
* **ci:** hold workflow token permissions and release signing ([5ca9231](https://github.com/lgriffin/ESI.ts/commit/5ca9231251e902162620a9b1f4b17b58267f81f9)), closes [#239](https://github.com/lgriffin/ESI.ts/issues/239)
* **circuit-breaker:** time reset, cleanup and the timer on a fake clock ([540be67](https://github.com/lgriffin/ESI.ts/commit/540be671b77a29cd92f52d1dbbc28a6c2fccda9a)), closes [#382](https://github.com/lgriffin/ESI.ts/issues/382)
* clear lint findings under tests/ ([4ca8384](https://github.com/lgriffin/ESI.ts/commit/4ca838495b5c146231911b499d58af215c3f2445))
* **contract:** look back at most five contract pages for auctions ([8a3ace6](https://github.com/lgriffin/ESI.ts/commit/8a3ace6ecb35a5bad113d4d467651eaac693a77d))
* **contract:** rebuild the negative status fixture from the new recording ([98464be](https://github.com/lgriffin/ESI.ts/commit/98464be692e9dec060c0505b4dd160163f66fd7f))
* **contract:** record public contract items from the newest contracts ([f57bfae](https://github.com/lgriffin/ESI.ts/commit/f57bfaead1e2338030b72275ff0124f539804b2d))
* **contract:** record the meta/openapi.yaml fixture ([cd35e9a](https://github.com/lgriffin/ESI.ts/commit/cd35e9a13b4f06146708a70bc983c1ccec4b8afa))
* **contract:** recorded ESI payloads changed shape ([#443](https://github.com/lgriffin/ESI.ts/issues/443)) ([6b6759d](https://github.com/lgriffin/ESI.ts/commit/6b6759d8a3bdba70c22fe44dadc68e522637e96d))
* **contract:** replay a text fixture as the document and compare it exactly ([9701a6f](https://github.com/lgriffin/ESI.ts/commit/9701a6f056ec1367a3ea1bbf579885f478953f62))
* **contract:** skip an empty 200 body instead of aborting the recording ([608afc7](https://github.com/lgriffin/ESI.ts/commit/608afc79d8b01e970c8635e0a38b814f8a8d4fdf))
* **contract:** walk back through contract pages to find auctions ([01c7a6a](https://github.com/lgriffin/ESI.ts/commit/01c7a6ad0c92454b17170b53b8650be7ab706b19))
* **contract:** walk back through contract pages to find auctions ([7c9713f](https://github.com/lgriffin/ESI.ts/commit/7c9713f88f1b46e232686560f8fbde875878b59d)), closes [#403](https://github.com/lgriffin/ESI.ts/issues/403)
* **core:** move the no-content unit tests into their own file ([f8a4568](https://github.com/lgriffin/ESI.ts/commit/f8a45689a29eab0e7817c4f379646fae9ad9ef9a))
* **core:** move time-dependent tests to fake clocks with exact boundaries ([2013d05](https://github.com/lgriffin/ESI.ts/commit/2013d05903f9cafedcefa43bcb463b9d56391e11))
* **core:** pin the no-content branch's status and log ([611ace3](https://github.com/lgriffin/ESI.ts/commit/611ace318d9324c1fafa0b3c628a5be6476fad61))
* **core:** record retry back-offs instead of sleeping through them ([52c69ab](https://github.com/lgriffin/ESI.ts/commit/52c69ab595b4189759dc93eaab08ae1d3956601e)), closes [#382](https://github.com/lgriffin/ESI.ts/issues/382)
* **docs:** check guide anchors with the site's slugifier and reference links ([1331c6b](https://github.com/lgriffin/ESI.ts/commit/1331c6b4213aef808777a261a744ba1e02ea22e9)), closes [#273](https://github.com/lgriffin/ESI.ts/issues/273)
* **examples:** fix the failures the first live run found, and review findings ([b682d4c](https://github.com/lgriffin/ESI.ts/commit/b682d4cb531346745bd8541d5ee37ebb14d85754))
* **examples:** report the newest compatibility date whatever the order ([687612f](https://github.com/lgriffin/ESI.ts/commit/687612f6c88ecbc7b692344f0359bf39e6a1f570))
* **examples:** run the public examples nightly against live ESI ([c4e64a4](https://github.com/lgriffin/ESI.ts/commit/c4e64a430e13da69266c1b2d620e15617bf45b4e))
* **examples:** run the public examples nightly against live ESI ([398f693](https://github.com/lgriffin/ESI.ts/commit/398f693a2b3fde6d5e049d313217289d98bd881f))
* **examples:** use the 2026-08-18 response shapes ([54212f6](https://github.com/lgriffin/ESI.ts/commit/54212f6cd6c267b19597272d833b8e9ec99760d3))
* **examples:** use the 2026-08-18 response shapes ([85c39b6](https://github.com/lgriffin/ESI.ts/commit/85c39b6703897e0bd09e5c55e6eacd2e58bde11f))
* **faults:** assert no repeat of page 1 revalidates it alone ([ad04003](https://github.com/lgriffin/ESI.ts/commit/ad0400397ef13e05aba508217e0d133a9d888452))
* **faults:** expect EsiParseError for unparseable 200 bodies; raise ./errors budget ([ac1e910](https://github.com/lgriffin/ESI.ts/commit/ac1e91012878bbcdffa6060b2fad1c2770a213b7))
* **faults:** filter refined schemas and serve text endpoints as text in the nightly fuzz ([94c87fe](https://github.com/lgriffin/ESI.ts/commit/94c87febbf68decf41e5323f3d4a812433125dee))
* **faults:** pin the page-1 repeat when a later page keeps failing ([0578acf](https://github.com/lgriffin/ESI.ts/commit/0578acf2f84c23cee1edb3ffd125393c6949af0e))
* **faults:** pin the page-1 repeat when a later page keeps failing ([076da67](https://github.com/lgriffin/ESI.ts/commit/076da6738ad3fdda6fd065a13798a65aecf0c8a2)), closes [#291](https://github.com/lgriffin/ESI.ts/issues/291)
* **fuzz:** draw all-non-string locale maps so the extraction vacuity check cannot miss its mutant ([#538](https://github.com/lgriffin/ESI.ts/issues/538)) ([9486fe2](https://github.com/lgriffin/ESI.ts/commit/9486fe2cd4da5510e55ad7539a30574b0c28beba))
* **fuzz:** expect dot segments to be rejected in buildEndpointPath ([0518111](https://github.com/lgriffin/ESI.ts/commit/05181111e7fc71afbddb195754fa08a9834aec1b))
* **fuzz:** keep dot segments out of the accepted-path-param arbitraries ([fe9d4c5](https://github.com/lgriffin/ESI.ts/commit/fe9d4c58a9143d28b8a552df99e90e945a5a990e))
* **fuzz:** property and model-based tests for the SDE provider and transforms ([#515](https://github.com/lgriffin/ESI.ts/issues/515)) ([51d7b31](https://github.com/lgriffin/ESI.ts/commit/51d7b31a9a00499e8d4b64da7ef75127277681d4))
* **fuzz:** start Prism in-process and print its log when the fuzz mock never answers ([#537](https://github.com/lgriffin/ESI.ts/issues/537)) ([2f40cb2](https://github.com/lgriffin/ESI.ts/commit/2f40cb286b4c6955791150698167b1ba41c1ae96))
* green the fault, Schemathesis and recorded-payload nightlies ([7f82583](https://github.com/lgriffin/ESI.ts/commit/7f82583348aa54114262b56080caf638f514f9f9))
* **package-lint:** run the size-limit fixture only where size-limit 13 runs ([eb3fd74](https://github.com/lgriffin/ESI.ts/commit/eb3fd7442f48ba40a50eeb005bc23aaa85da918e))
* **parity:** assert EsiClient's compatibilityDate too ([0423c52](https://github.com/lgriffin/ESI.ts/commit/0423c522e336db6bad8d2b2891ab0eb0215d58d8))
* **ports:** drop the two exports the ports test now covers from the export-coverage baseline ([f6cd9de](https://github.com/lgriffin/ESI.ts/commit/f6cd9de244a0c9afe8911ab6616dbf3b237bae32))
* **rate-limiter:** assert exact waits on a fake clock ([2b43a59](https://github.com/lgriffin/ESI.ts/commit/2b43a594462a6732102493c2f9f3fbc2eab594e5)), closes [#382](https://github.com/lgriffin/ESI.ts/issues/382)
* **request-pipeline:** pin the spec-TTL and duration boundaries ([2077df6](https://github.com/lgriffin/ESI.ts/commit/2077df6d207eeab63333053e0aab3b3913884378)), closes [#382](https://github.com/lgriffin/ESI.ts/issues/382)
* **schemas:** cover the mutation response schemas ([c533dde](https://github.com/lgriffin/ESI.ts/commit/c533ddea9c94e2391f81bc06f03a7dd49c6a3de5))
* **sde:** specify remaining lookups, loading, optional peers and ingestion ([#514](https://github.com/lgriffin/ESI.ts/issues/514)) ([03eb8be](https://github.com/lgriffin/ESI.ts/commit/03eb8be19a926fb652f38caa215b57bb78274a02))
* **sde:** specify type, universe, market and dogma lookups ([#513](https://github.com/lgriffin/ESI.ts/issues/513)) ([a6b63aa](https://github.com/lgriffin/ESI.ts/commit/a6b63aa1c92c3287b6dcc7481c15334ec74abed3))
* **skyhooks:** cover RaidableSkyhooksResponse and its schema ([1774c49](https://github.com/lgriffin/ESI.ts/commit/1774c49e9d4251b9b0d76edfacfca842c0d7fc8c))
* **spec:** gate domain-client method coverage against the EARS specification ([#528](https://github.com/lgriffin/ESI.ts/issues/528)) ([13239f1](https://github.com/lgriffin/ESI.ts/commit/13239f1c964323786922eb64f97dee133eb18ac1))
* **types:** tsd coverage for ./sde and ./sde/memory; seed type-mutation floors ([#517](https://github.com/lgriffin/ESI.ts/issues/517)) ([c1aa7e7](https://github.com/lgriffin/ESI.ts/commit/c1aa7e7a55c5f60b02561d933e8e6a369e5cb11c))
* **util:** drive concurrency pools with fake timers ([0a4b4f0](https://github.com/lgriffin/ESI.ts/commit/0a4b4f0d189c12bcdd60c6a2b81d5bdf6bba9c9e)), closes [#382](https://github.com/lgriffin/ESI.ts/issues/382)

## [10.2.3](https://github.com/lgriffin/ESI.ts/compare/v10.2.2...v10.2.3) (2026-09-26)


### Fixed

* **transport:** leave X-User-Agent off when clientId is not a legal header value ([a744910](https://github.com/lgriffin/ESI.ts/commit/a744910fc635a3f861ea185623f839e2df26fa56))
* **transport:** send the configured clientId as X-User-Agent ([8a073ec](https://github.com/lgriffin/ESI.ts/commit/8a073ec624f3812a6c0c96d60cec96b1a969cca9))


### Changed

* **api:** record ApiClient.getClientId in the API report ([6ecda49](https://github.com/lgriffin/ESI.ts/commit/6ecda49681e2d600d824109c80d0b1b7aa2ac082))


### Testing

* **contract:** re-record ESI payloads whose shape changed ([cc1783f](https://github.com/lgriffin/ESI.ts/commit/cc1783fadba5adebe08b278646b2561b037f542a))
* **contract:** recorded ESI payloads changed shape ([74b0ed7](https://github.com/lgriffin/ESI.ts/commit/74b0ed79ecc70628e74549b920bf9d948cdb1f61))

## [10.2.2](https://github.com/lgriffin/ESI.ts/compare/v10.2.1...v10.2.2) (2026-09-23)


### Fixed

* **deps:** list zod only in dependencies so --omit=dev keeps it ([e9b80c1](https://github.com/lgriffin/ESI.ts/commit/e9b80c1342ce846fb1f351c171d4e2a8c7bd0155)), closes [#384](https://github.com/lgriffin/ESI.ts/issues/384)
* **mutation-pr:** say when a directory score is partly the nightly's ([9ade805](https://github.com/lgriffin/ESI.ts/commit/9ade805e31e11e5e8f0639f28192b315d18dbd3d))


### Changed

* **deps:** bump the minor-and-patch group across 1 directory with 6 updates ([f65a8c1](https://github.com/lgriffin/ESI.ts/commit/f65a8c176049f645161b2d0a4161f6f33e2f3190))


### Documentation

* add Marp presentation on repo history and evolution ([f4047f8](https://github.com/lgriffin/ESI.ts/commit/f4047f8e2ee14d15b4d515dc79cf190362cf9607))
* commit knowledge graph report (graphify) ([e377009](https://github.com/lgriffin/ESI.ts/commit/e3770098add384079f81bb36797df78b39d723fa))
* integrate graphify knowledge graph for architecture queries ([3260793](https://github.com/lgriffin/ESI.ts/commit/3260793918178405444cb9e40d2d5ff880c55714))


### Testing

* **canary:** verify release assets — SBOM, cosign bundles, checksums ([1180b1a](https://github.com/lgriffin/ESI.ts/commit/1180b1a559ebf82955b18ecf4cbddc69f68c66d2))
* **contract:** re-record ESI payloads whose shape changed ([60662dc](https://github.com/lgriffin/ESI.ts/commit/60662dcf029d5e7bfc67e2666257e0a9bfb664a6))
* **contract:** recorded ESI payloads changed shape ([60e72ac](https://github.com/lgriffin/ESI.ts/commit/60e72acf3a4c9c225b54e093ae51490cd2123f24))

## [10.2.1](https://github.com/lgriffin/ESI.ts/compare/v10.2.0...v10.2.1) (2026-09-19)


### Changed

* **core:** drop two branches no input can tell apart ([52e82b9](https://github.com/lgriffin/ESI.ts/commit/52e82b9f4c0852a9e25a0d108228ca59e0ca2a21))


### Testing

* **logger:** drop logFatal and logTrace from the export-coverage baseline ([e7fd0e6](https://github.com/lgriffin/ESI.ts/commit/e7fd0e6e8d9c05e70084cd401e49190ff1042cfa))
* **logger:** kill every logger and util mutant ([9598d31](https://github.com/lgriffin/ESI.ts/commit/9598d317eadc5e12b00787a652f77099471ee7b1))
* **logger:** kill every logger and util mutant, and hold logger at 100 ([ad42937](https://github.com/lgriffin/ESI.ts/commit/ad4293716552da85ae3a44b93d764d35ac85da42))
* **pagination:** kill every pagination mutant ([cd15995](https://github.com/lgriffin/ESI.ts/commit/cd1599586e077cec6f534fec6bf608be46996bd3))

## [10.2.0](https://github.com/lgriffin/ESI.ts/compare/v10.1.1...v10.2.0) (2026-09-19)


### Added

* **release:** attach a signed CycloneDX SBOM to each release ([1e29d7d](https://github.com/lgriffin/ESI.ts/commit/1e29d7de39237ecd250dcac3ef90da54a9c52df3))


### Testing

* **contract:** re-record ESI payloads whose shape changed ([2ea4198](https://github.com/lgriffin/ESI.ts/commit/2ea4198d8832d12618e9f9a9da0720ffb9b07f55))

## [10.1.1](https://github.com/lgriffin/ESI.ts/compare/v10.1.0...v10.1.1) (2026-09-18)


### Documentation

* **mutation:** record the first complete sharded run, and fix what it exposed ([3209241](https://github.com/lgriffin/ESI.ts/commit/32092415c551cbc7cc75266fa7158ab884040aad))

## [10.1.0](https://github.com/lgriffin/ESI.ts/compare/v10.0.0...v10.1.0) (2026-09-18)


### Added

* **dedupe:** detach in-flight reads of a path a write has just changed ([e3a3d91](https://github.com/lgriffin/ESI.ts/commit/e3a3d91d2ef74759245cd43affb2e109040bf221))
* **release:** verify what npm serves, not only what CI built ([281e008](https://github.com/lgriffin/ESI.ts/commit/281e008d9fd65e45619f73c6abeb7a48dbc70831))


### Fixed

* add the composition and concurrency test tier and fix the five pipeline races it found ([c7a7642](https://github.com/lgriffin/ESI.ts/commit/c7a764213ebc34fc47bd8396863b4f8f7938f4a1))
* **bdd:** escape backslashes in the job summary's table cells ([751d098](https://github.com/lgriffin/ESI.ts/commit/751d098f4d2fa81c86c80e7a8e8221991c81495d))
* **benchmark:** keep the harness filter a substring and gate the soak heap trend on Node 20 ([d559157](https://github.com/lgriffin/ESI.ts/commit/d5591576dcdb2823a7df8e2692597b7fc92575fe))
* **cache:** do not store a read that a write overtook while it was in flight ([e2f3141](https://github.com/lgriffin/ESI.ts/commit/e2f3141b2a4713bf4a46c2ea58ad42e02bc40814))
* **cache:** keep the stored ETag when a late 304 names an older one ([bb63097](https://github.com/lgriffin/ESI.ts/commit/bb6309753938f8868fcb1ea9684d44989933086a))
* **cache:** refetch when a 304 arrives for an entry evicted in flight ([4ae476e](https://github.com/lgriffin/ESI.ts/commit/4ae476e9462ae1eac33569b9d4c70bb36ad545d3))
* **ci:** pack the downloaded dist with npm 11 ([7e7ff71](https://github.com/lgriffin/ESI.ts/commit/7e7ff7131a3b383cae3ae65c79f677a28f1369b7))
* **circuit-breaker:** count the call that opens half-open as the first probe ([b418625](https://github.com/lgriffin/ESI.ts/commit/b418625bbf7ade64217fde9970bd76229dbb8ffd))
* **circuit-breaker:** keep an open circuit open when an earlier call succeeds ([03b27a5](https://github.com/lgriffin/ESI.ts/commit/03b27a5e1e641ddcf015f5e08f1420966c60b4ce))
* **ci:** read the attw report from a file so CI gets the whole JSON ([dac266d](https://github.com/lgriffin/ESI.ts/commit/dac266d5ec13b5bb2ba13a0a6f7a94b25da0ba0c))
* **dedupe:** key in-flight requests by identity as well as endpoint ([5d662d9](https://github.com/lgriffin/ESI.ts/commit/5d662d9699aab9f9bb34af93a8fb5809a02ccde6))
* five defects found by new model-based property tests (circuit breaker, pagination cache, backoff) ([80fcafa](https://github.com/lgriffin/ESI.ts/commit/80fcafa5bb99aed93348c30722c090e526b85fb7))
* **generate:** generate from the compatibility date the client actually sends ([5ea4a2f](https://github.com/lgriffin/ESI.ts/commit/5ea4a2fe0891bcba5c3d08171bb3d858639ea3f4))
* **mutation:** escape backslashes in the job summary table cells ([9ab23fa](https://github.com/lgriffin/ESI.ts/commit/9ab23fa685f68288b138dad749aed9bf871c215f))
* **package:** ship ES module declarations for the import condition ([d53fe91](https://github.com/lgriffin/ESI.ts/commit/d53fe914a156faad1835c1e748cd500254e57b69))
* **pagination:** cache an authenticated paginated result under the token-scoped key ([23313ff](https://github.com/lgriffin/ESI.ts/commit/23313ff95cf45a043ce2c27ea61d483969701366))
* **pagination:** never revalidate page 1 alone when a later page exhausts its retries ([8c48085](https://github.com/lgriffin/ESI.ts/commit/8c48085366af3eeb278be8bf033b45e53d353962))
* **pipeline:** name the status when an error response has no reason phrase ([94827fb](https://github.com/lgriffin/ESI.ts/commit/94827fb5652d8e76b27d509eb3eabb2ae21c6ecc))
* **pipeline:** time out and retry a response body that stalls or resets ([8e8753f](https://github.com/lgriffin/ESI.ts/commit/8e8753f36c272cbd796f93a92776c8c3d3fd7d0a))
* **rate-limiter:** honour Retry-After given as an HTTP date ([1fb7cba](https://github.com/lgriffin/ESI.ts/commit/1fb7cba9a6b553f969fa2466f181018102d63bf3))
* **rate-limit:** keep the error-limit back-off when a late response reports budget left ([1c7279b](https://github.com/lgriffin/ESI.ts/commit/1c7279b9223702e64943e71bef3278488b4762d6))
* **release:** keep the canary off the shared npm cache ([8604246](https://github.com/lgriffin/ESI.ts/commit/86042464188ec6603f681d5564984275acd40866))
* **release:** publish the tarball that was tested and signed ([c4ac638](https://github.com/lgriffin/ESI.ts/commit/c4ac6389a1844ddddc37fb7d380377e296e90ba1))
* **retry:** return a zero backoff instead of NaN past attempt 1023 ([ae36c02](https://github.com/lgriffin/ESI.ts/commit/ae36c022ce2c05fc33474110a801bd9121cb2438))
* **retry:** serve a retry from a fresh cache entry a concurrent call stored ([de5f7ee](https://github.com/lgriffin/ESI.ts/commit/de5f7eee75b89a45bbbe8e909462145ea805fba1))
* **type-mutation:** resolve entry points whose types sit under a condition ([330c69e](https://github.com/lgriffin/ESI.ts/commit/330c69e78b7854e6a7a9718fa2ce0fff4257c3ef))
* **types:** escape backslashes before pipes in the type mutation survivor table ([8d7d4de](https://github.com/lgriffin/ESI.ts/commit/8d7d4de6278cd968070c0c58f3e5e781815ad512))


### Changed

* **bdd:** share the feature outline and feature bindings ([f75f261](https://github.com/lgriffin/ESI.ts/commit/f75f261958addd53fb22571ac649de9153b8cdab))
* **ci:** lint the packed tarball and budget each exports sub-path's size ([63c5f26](https://github.com/lgriffin/ESI.ts/commit/63c5f26d19236d6ab397e5e95b5d3ee3328aead9))
* **ci:** run the properties nightly at 10000 runs and document the tier ([06c79d2](https://github.com/lgriffin/ESI.ts/commit/06c79d268c85cd654d8f8e48b6b93ceb4d2cfc5d))
* **ci:** sample four overlapping calls nightly in seeded random order ([510b940](https://github.com/lgriffin/ESI.ts/commit/510b940f2cdf10abdbaaa38097f289143d7bf307))
* **lint:** lint tests/ for focused, skipped, assertion-free and silenced tests ([9bdf6bf](https://github.com/lgriffin/ESI.ts/commit/9bdf6bf174fe0476a213389ca4103fe90b00898c))
* **scripts:** check that every npm script points at a file that exists ([55b03c7](https://github.com/lgriffin/ESI.ts/commit/55b03c77f0b6d636b7ec6ce6837f2bf642cb48c9))
* **scripts:** run every offline CI tier locally with one command ([31197ac](https://github.com/lgriffin/ESI.ts/commit/31197accc81750b20a7412421e7b9e3ada57f9c6))


### Documentation

* **agents:** pin the semver rules against drift, and fix a retired config reference ([d2af258](https://github.com/lgriffin/ESI.ts/commit/d2af258aa7a2d82a12eb56a014432f1d14c1a558))
* **bdd:** document the execution check, bug tags and when a Rule is protection ([fa0be02](https://github.com/lgriffin/ESI.ts/commit/fa0be0281996fd5e7fadeffcadbece5c81299b59))
* **contract:** name the real reason those endpoints cannot be recorded ([b8ea80d](https://github.com/lgriffin/ESI.ts/commit/b8ea80d3861813490fe012fcc1abda57bdce5485))
* declare TypeScript 5.4 as the oldest supported version ([f9e5f66](https://github.com/lgriffin/ESI.ts/commit/f9e5f66c4a3065ac82d8f0dab809b44d931e2a0a))
* describe the benchmark and heap soak tier ([f28cc2c](https://github.com/lgriffin/ESI.ts/commit/f28cc2c9d74115ebffce382a27ed362d96e5401a))
* **mutation:** record the measured pull request job timings ([62c70c9](https://github.com/lgriffin/ESI.ts/commit/62c70c93c7f0904a4804e64a8c7a62d971e79cea))
* **testing:** describe the composition and concurrency tier ([e1ee338](https://github.com/lgriffin/ESI.ts/commit/e1ee338f738a35c8bcdcfc461304a8d8c560e0c3))
* **testing:** describe the fault tier and the decisions it pins ([39416c7](https://github.com/lgriffin/ESI.ts/commit/39416c72167ab589dce475912a75832fc2318c1e))
* **testing:** describe the recorded payload replay tier ([1b190f3](https://github.com/lgriffin/ESI.ts/commit/1b190f31e4c2d10de462905f83681881ecb9ee20))
* **testing:** map the suite in C4 and refresh the tier counts ([06facdb](https://github.com/lgriffin/ESI.ts/commit/06facdb6994e41bff84eea7ca5fe1fe649066ba6))


### Testing

* **bdd:** let the transport seam fail an exchange the way a network does ([8f0a7a9](https://github.com/lgriffin/ESI.ts/commit/8f0a7a9d9eb4dc9c7eeb9a2ffe1d958ca64d7f2f))
* **bdd:** prove every scenario executes, name JUnit cases by Rule, and link [@bug](https://github.com/bug) to a tracker ([752de4c](https://github.com/lgriffin/ESI.ts/commit/752de4caa193c8fbb6d4f6d79de2a54fc071a46f))
* **bdd:** report every scenario by Rule and fail when one did not run ([b04a2d7](https://github.com/lgriffin/ESI.ts/commit/b04a2d7818754cd3daa1b504ed17d2fe1af4bd23))
* **bdd:** state what the performance scenarios verify, not a latency budget ([12b4461](https://github.com/lgriffin/ESI.ts/commit/12b44616b7b2f7e59cac06fc27e1d9eaed797815))
* **benchmark:** decide regressions statistically, not by percentage ([a3da1f8](https://github.com/lgriffin/ESI.ts/commit/a3da1f875fd2853e4312b41b2a3aaa799f49db9b))
* **benchmark:** measure the client hot paths with a mitata harness ([307b978](https://github.com/lgriffin/ESI.ts/commit/307b97850e4d5127b1572b6bed9313dcee17b698))
* **benchmark:** soak the pipeline for 100 000 requests and watch the heap ([34ab5ec](https://github.com/lgriffin/ESI.ts/commit/34ab5eca8c4918ee9f1147e0ff41318078e81d43))
* **benchmark:** statistical benchmark comparison, heap soak and a smoke-only latency spec ([1c62567](https://github.com/lgriffin/ESI.ts/commit/1c625674c1befaa90bf39438f931e16f15eb4119))
* **composition:** add a deterministic interleaving scheduler at the transport seam ([9ebbedb](https://github.com/lgriffin/ESI.ts/commit/9ebbedbc0935e3351e3fad55f56984cf9ea0d457))
* **composition:** escape backslashes in the printed reproduce command ([d96de7b](https://github.com/lgriffin/ESI.ts/commit/d96de7ba999268d0438661d67b407e8df945d86b))
* **composition:** explore retry inside an opening circuit and stale-on-error during a refresh ([309658d](https://github.com/lgriffin/ESI.ts/commit/309658d9490261e7eef84b5a6de1da12e16e161a))
* **composition:** explore three overlapping calls on PRs and four nightly ([4122f14](https://github.com/lgriffin/ESI.ts/commit/4122f14693ed1927f957836304999db42078393e))
* **consumer:** check the tarball as a matrix of consumer cells ([81c0cd0](https://github.com/lgriffin/ESI.ts/commit/81c0cd0cd97f548b35266991aad7c1ec805a233d))
* **consumer:** stop esbuild once the tree-shaking check has run ([9e9bea3](https://github.com/lgriffin/ESI.ts/commit/9e9bea30affcc0fdd73a015c9cb516f8b3d79144))
* **consumer:** widen the consumer contract to a Node x TypeScript x resolution matrix ([14880dd](https://github.com/lgriffin/ESI.ts/commit/14880dd5e341ec66f0871d5fadd5092e1e681b52))
* **contract:** assert replay failures through named helpers the lint knows ([53e4b03](https://github.com/lgriffin/ESI.ts/commit/53e4b032ba437a71841086ec68541ea9fa78f295))
* **contract:** re-record ESI payloads whose shape changed ([bfe9af5](https://github.com/lgriffin/ESI.ts/commit/bfe9af5bb1ef26b639c5f836446633d7fb76a924))
* **contract:** re-record ESI payloads whose shape changed ([1f1be53](https://github.com/lgriffin/ESI.ts/commit/1f1be53fdec4f2a42ba260d5113c3e85d4dc0a4c))
* **contract:** record public ESI payloads and replay them through the client pipeline ([60d897e](https://github.com/lgriffin/ESI.ts/commit/60d897e45f845bb729cda580730412c5bb2d4ecb))
* **contract:** record sanitised public ESI payloads as fixtures ([d08cae6](https://github.com/lgriffin/ESI.ts/commit/d08cae62d9dc09ca86f773602641f89363044c69))
* **contract:** recorded ESI payloads changed shape ([184d67f](https://github.com/lgriffin/ESI.ts/commit/184d67f781e32c6be8763eb93ef8a4ffa293c509))
* **contract:** recorded ESI payloads changed shape ([6d1bbe8](https://github.com/lgriffin/ESI.ts/commit/6d1bbe83f3ecd2239b3abffe5df472b2b02ccdfe))
* **contract:** replay recorded ESI payloads through the client pipeline ([ee8f0df](https://github.com/lgriffin/ESI.ts/commit/ee8f0dff5dd527ad089d77c5246456f48fa08c9b))
* **docs:** type-check documentation examples against the packed package ([7746ada](https://github.com/lgriffin/ESI.ts/commit/7746ada98d04b8af72a005cc3645efc205e83cc3))
* **faults:** add a 400 served while the cache holds an entry ([d85b4fb](https://github.com/lgriffin/ESI.ts/commit/d85b4fba2c2e496337b46f3dce6ff1974870775e))
* **faults:** add a status the client has no text for, without a reason phrase ([1fe646a](https://github.com/lgriffin/ESI.ts/commit/1fe646a526ece7434966e0211c4a933071aad0b5))
* **faults:** add a transport fault catalogue run through the real pipeline ([1f5f055](https://github.com/lgriffin/ESI.ts/commit/1f5f055c2721cb7da9e67518d6237425b599e980))
* **faults:** assert through the helpers the suite-health lint knows ([0064539](https://github.com/lgriffin/ESI.ts/commit/0064539656221bdd30e1b0559da5d9854ee88e5c))
* **faults:** drop the x-pages gap the pagination fix closed ([2f89d91](https://github.com/lgriffin/ESI.ts/commit/2f89d919c531c2b06f1eb41539e4c5ed71f4297a))
* **faults:** fault injection and fuzzing tier (transport fault catalogue) ([e3cee50](https://github.com/lgriffin/ESI.ts/commit/e3cee50f55a9f4c75b3d73569c55b1a608580acf))
* **faults:** fuzz every endpoint's payloads from its Zod schema nightly ([49dc045](https://github.com/lgriffin/ESI.ts/commit/49dc045d33fb538483e046c1c525d1982c7a0512))
* **fuzz:** model-based properties with a vacuity check for every property ([d2890ab](https://github.com/lgriffin/ESI.ts/commit/d2890ab5b6e1b9de690b6ba4ac7c08d8e33af253))
* **fuzz:** require eager pagination repeat calls to come from the cache ([cc57bc8](https://github.com/lgriffin/ESI.ts/commit/cc57bc8507f76af3614ddfc8441b6172fcde73d1))
* **fuzz:** respell all occurrences in cache-key lookalikes; ratchet export baseline ([1554338](https://github.com/lgriffin/ESI.ts/commit/155433898d56a6f52055f13f4847cf5ca025c56d))
* **mutation:** gate changed files per directory and prove the gate can fail ([c9a1b44](https://github.com/lgriffin/ESI.ts/commit/c9a1b4436643d529d30049eceaad8fb088a9b029))
* reference the exports v10 added and drop ContractBid from the export baseline ([2633694](https://github.com/lgriffin/ESI.ts/commit/26336943d3897e1a8af85b82d0f9cc5754f54b75))
* **spec-audit:** require a tracker tag beside every [@bug](https://github.com/bug) ([04ad7a0](https://github.com/lgriffin/ESI.ts/commit/04ad7a00ed0e1b009c39db799740b2e32bbbcaa0))
* **types:** mutate the built declarations nightly and ratchet the tsd kill score ([5d0a8a8](https://github.com/lgriffin/ESI.ts/commit/5d0a8a8c3ba32ac383e01de768040ac9d075bd64))

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

* **auth:** add EsiTokenManager with pluggable storage and bulk refresh ([91de317](https://github.com/lgriffin/ESI.ts/commit/91de317460b229547eb6fcbc78edd31582e6448d)), closes [#185](https://github.com/lgriffin/ESI.ts/issues/185) [#187](https://github.com/lgriffin/ESI.ts/issues/187)
* **logging:** per-client structured logging, engineering charter, release 9.9.0 ([ca9773b](https://github.com/lgriffin/ESI.ts/commit/ca9773bc9106741f9400690e4a14dbc6d39168fa))
* ramp-up phases 1, 3, 4 and 5 — load-bearing spec, CI gate, agent governance ([8453187](https://github.com/lgriffin/ESI.ts/commit/8453187e836dedcefc1d686a8371e19835c97bd2))
* **skills:** gate ears-gherkin-dev changes with an eval suite ([18865c8](https://github.com/lgriffin/ESI.ts/commit/18865c8848cde16b7243f3f17b60b270a98f3cca))
* **spec-consistency:** check Rule titles against response schemas ([eb4ed10](https://github.com/lgriffin/ESI.ts/commit/eb4ed105c28e33814cffb8bcdae9689cd6b74f6c))


### Fixed

* **auth:** address review findings on SSO exchange, refresh races and storage ([e8172f1](https://github.com/lgriffin/ESI.ts/commit/e8172f1efd781040bffc0a29ecca683fd61aeba6))
* **build:** let release-please bump PACKAGE_VERSION ([8ef9c19](https://github.com/lgriffin/ESI.ts/commit/8ef9c1994671891a67be438c5efd0cc2b4f5ffba))
* **build:** share one copy of each class across sub-path entries ([2f0ec0a](https://github.com/lgriffin/ESI.ts/commit/2f0ec0aa73051615a2bad3ed3a42c0e952c98d97))
* **cache:** evict a response body that fails schema validation ([22b0d0b](https://github.com/lgriffin/ESI.ts/commit/22b0d0b31276bf6526d52eb9ad3c7db43d3b8d7e))
* **cache:** evict cached reads after writes answered with 201 or 204 ([7e41381](https://github.com/lgriffin/ESI.ts/commit/7e413819ceaa591d961c254124fb4b4f25d16288))
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
* **release:** tag releases vX.Y.Z and start the changelog at 9.9.0 ([15e62d6](https://github.com/lgriffin/ESI.ts/commit/15e62d66a742325ef05b90aeb3c590fa1b2c661e))
* **schemas:** require fleet boss, customs office access flags and system position ([00fff7c](https://github.com/lgriffin/ESI.ts/commit/00fff7c06d946043e833833894f9f885093393c5))
* **schemas:** require vip, contract status and availability as ESI does ([24c8c35](https://github.com/lgriffin/ESI.ts/commit/24c8c35de56e92ceb821383808cc2359acfb6659))
* **schemas:** stop requiring fields the ESI spec marks optional ([fc8e489](https://github.com/lgriffin/ESI.ts/commit/fc8e489274a0b40700fd0f63818830a44db3bd60))
* **scripts:** drop drift baseline entries resolved by v10 part 2 ([1c54a30](https://github.com/lgriffin/ESI.ts/commit/1c54a3098d591c06479b3baee83c9efe23c3ea51))
* **scripts:** drop the 83 drift baseline entries [#317](https://github.com/lgriffin/ESI.ts/issues/317) resolved ([2cb7d18](https://github.com/lgriffin/ESI.ts/commit/2cb7d18779d70ecddff6b814715a50a2af5f7953))
* **scripts:** make schema:drift compare what it reports ([3dc4c53](https://github.com/lgriffin/ESI.ts/commit/3dc4c532d61fe100e842fda7d25f16093d19fe41))
* **scripts:** make schema:drift compare what it reports, with a ratcheted baseline ([7f428f9](https://github.com/lgriffin/ESI.ts/commit/7f428f926ca5b4e6ce43ef2dd626578409c1552c))
* **sde:** load js-yaml and adm-zip lazily as optional peer dependencies ([526587b](https://github.com/lgriffin/ESI.ts/commit/526587beb77612daaf77e7c2da581fa21cf7ce69))
* **sde:** read nested _sde.yaml metadata from ZIP archives ([13d04cb](https://github.com/lgriffin/ESI.ts/commit/13d04cbc3ce74b431f94688ad293163a97f29489))
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
* **deps:** bump @cucumber/messages from 24.1.0 to 34.2.1 ([bf2414d](https://github.com/lgriffin/ESI.ts/commit/bf2414d8add5b0b872db7da21b0218a7f2cce742))
* **deps:** bump the minor-and-patch group with 7 updates ([7039ca7](https://github.com/lgriffin/ESI.ts/commit/7039ca7a64dae5013eb426e63905dcd36af9bf8e))
* **deps:** bump zod to 4.6.4 and js-yaml to 5.4.2 ([09dd9f0](https://github.com/lgriffin/ESI.ts/commit/09dd9f03888962f823f194bf7ae88ec1b6a276ca))
* **deps:** bundle Dependabot updates (zod, js-yaml, codeql-action) ([ea7a211](https://github.com/lgriffin/ESI.ts/commit/ea7a2113e24f90ecc3a5591bff8a23eb8b2ee5f4))
* **lint:** load the seam lint parser from the listed typescript-eslint package ([c87e31b](https://github.com/lgriffin/ESI.ts/commit/c87e31bd9183406838f7fbbfa7f2b984f4527d41))
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
* **guides:** write the charter guides and retire docs/ ([5b61eaa](https://github.com/lgriffin/ESI.ts/commit/5b61eaa41929efadf5a7233a922adc7202fd4dde))
* **quality-gates:** document schema drift matching, guard and baseline ([ccb1ce1](https://github.com/lgriffin/ESI.ts/commit/ccb1ce10d45c29f4c820f7c8de6779c5afb5669d))
* **sde:** document js-yaml and adm-zip as optional peer dependencies ([d8d8843](https://github.com/lgriffin/ESI.ts/commit/d8d884364f997d91c1bdc2d540a9170939af3832))
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

### Added (token management detail)

Drafted under `[Unreleased]` before release-please took over and shipped in
10.0.0; the list above links the same commits.

- **`EsiTokenManager`** — higher-level auth abstraction that owns the SSO token lifecycle for one or many characters (#185). Exchanges an authorization code, decodes the character id, name and scopes from the token, persists it through a pluggable `ITokenStorage`, refreshes ahead of expiry (`refreshSkewMs`, default 60 s), coalesces concurrent refreshes per character, persists the rotated refresh token before returning, and records an SSO `invalid_grant` so later calls fail locally with `TokenRevokedError`. `createClient(characterId)` returns an `EsiClient` wired with the character's token and a refresh provider bound to the manager; `tokenProviderFor(characterId)` exposes that provider for clients built by hand
- **Bulk refresh** — `refreshAll({ concurrency, expiringWithinMs, signal })` refreshes stored tokens with a concurrency cap (default 5), isolates failures per character, skips tokens outside an optional staleness window, and flags SSO 429/5xx failures as `retryable` (#187). Per-character failures never reject; every character gets a `RefreshResult`. A throwing `onProgress` callback and a non-finite `concurrency` value are tolerated; only a storage adapter that cannot list tokens rejects the call
- **`EveSsoClient`** — zero-dependency client for `login.eveonline.com`: `getAuthorizationUrl`, `exchangeCode`, `refresh`, `revoke`. `exchangeCode` repeats the `redirect_uri` from the authorization request (configured `callbackUrl` or a per-request `redirectUri`); an `invalid_grant` on a code exchange or revoke stays an `SsoError` and only a refresh maps it to `TokenRevokedError`; a 2xx body that is not a JSON object with both tokens is reported as `SsoError` `invalid_response`. Confidential clients authenticate with HTTP Basic; public clients use PKCE (`generatePkcePair`, `generateState`). SSO errors surface as `SsoError` (status + OAuth error code) or `TokenRevokedError`
- **Storage adapters** — `MemoryTokenStorage` and `FileTokenStorage` (atomic temp-file-and-rename writes, `0600` mode, serialised in-process writes, malformed entries skipped on load, `invalidate()` fenced against reads already in progress)
- **`runWithConcurrency`** internal utility in `src/core/util/concurrency.ts`
- `tests/bdd/features/core/0054-token-management.feature` — 26 EARS requirements covering the above, including the refresh-versus-removal and refresh-versus-re-authorization races, which the manager resolves in favour of the newer state
- `examples/token-manager.ts` and `npm run example:token-manager`

## [9.9.0] - 2026-09-15 (not published)

Never tagged or published to npm; everything below shipped in 10.0.0.

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

## [9.8.1] - 2026-09-13 (not published)

Written to `package.json` only, never tagged or published. Its CI and release
provenance changes shipped in 10.0.0.

## [9.8.0] - 2026-09-10 (not published)

Never tagged or published to npm; everything below shipped in 10.0.0.

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

## [9.6.2] - 2026-09-09 (not published)

Written to `package.json` only; see 9.7.0.

## [9.6.1] - 2026-08-29 (not published)

Written to `package.json` only; see 9.7.0.

## [9.6.0] - 2026-08-20

First release since 9.4.0. Versions 9.5.0, 9.5.1 and 9.5.2 were bumped in
`package.json` but never published, so upgrading from 9.4.0 picks up
everything below.

### Added

- **`CosmeticsClient` and `ParagonHubClient`** — new domain clients for the SKINR cosmetics endpoints (3) and the Paragon Hub endpoints (5), with Zod schemas and inferred types, exported from the package root. `MercenaryClient` and `SkyhooksClient` gain per-item detail endpoints (4), closing the spec drift for compatibility date 2026-08-18 ([#189](https://github.com/lgriffin/ESI.ts/issues/189))
- **`@lgriffin/esi.ts/sde/memory` sub-path export** — imports `MemorySdeProvider` without loading `adm-zip`, so ESM consumers (tsx, Vite) no longer hit its CommonJS `require('fs')` chain. `adm-zip` and `js-yaml` are no longer bundled ([#194](https://github.com/lgriffin/ESI.ts/issues/194))
- **npm provenance** — releases are published with `--provenance`, so the registry carries a signed SLSA attestation

### Security

- **ETag cache isolated per access token** — cache keys for authenticated endpoints (`requiresAuth: true`) now include a hash of the token, so a cache shared between clients for different characters can no longer serve one character's response to another. Public endpoints still share entries
- `setAccessToken()` and token refresh no longer clear the whole cache; with per-token keys the blanket clear was unnecessary and emptied caches shared with other clients
- GitHub Actions pinned by commit SHA and workflow token permissions reduced

## [9.5.2] - 2026-08-20 (not published)

Written to `package.json` only; see 9.6.0.

## [9.5.1] - 2026-08-20 (not published)

Written to `package.json` only; see 9.6.0.

## [9.5.0] - 2026-08-20 (not published)

Written to `package.json` only; see 9.6.0.

## [9.4.0] - 2026-08-19

First release since 9.1.0. Versions 9.1.1, 9.1.2, 9.1.3 and 9.2.0 were bumped
in `package.json` but never published, and 9.3.0 was never used, so upgrading
from 9.1.0 picks up everything below.

### Added

- **`@lgriffin/esi.ts/sde` sub-path export** — a standalone reader for CCP's Static Data Export with no ESI dependency. `SdeDataProvider` loads the SDE YAML files from disk into memory and `MemorySdeProvider` serves data you supply; both implement `IStaticDataProvider`. All 101 SDE entity types have typed interfaces and Zod schemas, with `SdeTestDataFactory` for test data. Examples cover type lookup, fitting, industry and the market group tree
- **`compatibilityDate` client option** — `EsiClientConfig.compatibilityDate` sets the `X-Compatibility-Date` header per client instead of always sending the built-in constant, so consumers can pin ESI behaviour ([#178](https://github.com/lgriffin/ESI.ts/issues/178))
- **`esiEnum()`** in `@lgriffin/esi.ts/schemas` — an enum schema that accepts values it does not know, so a value CCP adds to an ESI enum no longer fails response validation ([#184](https://github.com/lgriffin/ESI.ts/issues/184))

### Changed

- Types regenerated from the ESI spec
- Nightly security audit, OpenSSF Scorecard and an Are The Types Wrong package check added to CI; mutation testing moved from the pull request pipeline to a nightly run

### Security

- npm overrides for `esbuild` (>= 0.28.1) and `uuid` (~11.1.1) clear two advisories in the dependency tree

## [9.2.0] - 2026-08-18 (not published)

Written to `package.json` only; see 9.4.0.

## [9.1.3] - 2026-08-18 (not published)

Written to `package.json` only; see 9.4.0.

## [9.1.2] - 2026-08-18 (not published)

Written to `package.json` only; see 9.4.0.

## [9.1.1] - 2026-08-18 (not published)

Written to `package.json` only; see 9.4.0.

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

## [8.0.0] - 2026-08-05

### Breaking Changes

- **Market order types split by ESI shape** — `MarketClient.getCharacterOrders()`, `getCharacterOrderHistory()`, `getCorporationOrders()` and `getCorporationOrderHistory()` return `CharacterMarketOrder`, `CharacterMarketOrderHistory`, `CorporationMarketOrder` and `CorporationMarketOrderHistory` instead of the shared `MarketOrder`. Retype annotations on these calls
- **Resilience components are typed by interface** — `ApiClient.getCircuitBreaker()` / `setCircuitBreaker()` take and return `ICircuitBreaker`, and the deduplicator accessors take `IDeduplicator`, instead of the concrete classes
- **`CustomEsiClient` and `EsiApiFactory` honour the full configuration** — both now go through the new `configureApiClient()`, so cache, deduplication, circuit breaker, retry, interceptors and timeout settings that were silently ignored now take effect
- **Logging uses pino instead of winston**; the `ILogger` interface is unchanged
- The package now ships an ES module build (`module`) beside the CommonJS one

### Added

- **`stream*` methods on 16 more domain clients** — 57 new async-generator methods for paginated endpoints, and `BaseEsiClient.streamEndpoint()` is now public for endpoints without a named wrapper
- **Opt-in request body validation** — `validateRequest: true` in `EsiClientConfig` validates POST/PUT/DELETE bodies against the endpoint's `requestSchema` before sending. `EsiValidationError` gains a `direction` field (`ValidationDirection`)
- **`IRetryStrategy`** — inject a custom retry strategy, following the `ICircuitBreaker` and `IDeduplicator` pattern
- **Circuit breaker `keyStrategy`** — `'resolved'` (default) or `'template'` in `CircuitBreakerConfig` groups circuits by resolved URL or endpoint template, and an optional cleanup timer is stopped with `destroy()`
- **Typed `createClient()` results** — `InferEndpointResult<D>` infers each method's return type from its endpoint's response schema instead of `unknown`

### Fixed

- Pagination and the rate limiter rethrow `EsiError` and `CircuitOpenError` with their status and retry classification instead of a plain `Error`; an exhausted rate-limit wait throws a retryable 429 instead of proceeding
- Cursor pagination throws `TimeoutError` on abort, so `isTimeout()` recognises it
- Cache entries use the endpoint's spec TTL so ETags survive long enough to revalidate
- Circuit breaker half-open probes no longer leak their slot on an early exception
- Structure market requests send the correct auth flag and `Accept` header
- Schema fields added from the ESI spec that responses may omit (`fleet_boss_id`, `allow_access_with_standings`, `allow_alliance_access`, `position`, sovereignty `alliance_id` and `solar_system_id`) are optional

### Security

- `ApiClient` serialises without its access token, `EsiValidationError` messages no longer include unsanitised URLs, and the ETag cache is cleared on token rotation
- High-severity npm audit findings and CodeQL findings resolved

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
