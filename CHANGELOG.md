# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [8.0.0](https://github.com/lgriffin/ESI.ts/compare/esi.ts-v7.4.0...esi.ts-v8.0.0) (2026-07-21)


### ⚠ BREAKING CHANGES

* Generated EsiSpec interface names changed (e.g. GetAlliancesAllianceIdOk → AlliancesAllianceIdGet). Cache TTL metadata key changed internally from x-cached-seconds to x-cache-age.
* adds zod as a production dependency; types are now derived from schemas which may affect consumers using exact type identity checks.

### Added

* accept-language config and ESI scope metadata ([28cf316](https://github.com/lgriffin/ESI.ts/commit/28cf3160ab5401ceaf9842d0e0e15ac8d9cfb0cb))
* accept-language config and ESI scope metadata ([7711ae2](https://github.com/lgriffin/ESI.ts/commit/7711ae295769ec4ccd7bc0da91d2a9db4a8cd99b))
* add 10 example files covering 78 GET endpoints with schema fixes ([b09a632](https://github.com/lgriffin/ESI.ts/commit/b09a632e8d80d73b9a3f252cb57cddbe1df4da2c))
* add 10 example files covering 78 GET endpoints with schema fixes ([8de9edd](https://github.com/lgriffin/ESI.ts/commit/8de9eddd836877cfeda59fa5491b480b04dc9262))
* add branded ID types for type-safe ESI entity references ([edae644](https://github.com/lgriffin/ESI.ts/commit/edae6442228c92b5d04f491e26cf5520edb46977))
* add compile-time spec-to-Zod type alignment checks ([7ae0d2c](https://github.com/lgriffin/ESI.ts/commit/7ae0d2c496e20f6a902735783504f5c87a638eb5))
* add contract testing and property-based fuzz testing ([532bbc8](https://github.com/lgriffin/ESI.ts/commit/532bbc871ea90d91d8c3b53e3a31d5131b15b96b))
* add contract testing and property-based fuzz testing infrastructure ([5b8f06e](https://github.com/lgriffin/ESI.ts/commit/5b8f06ea4979586d929e0a6b00190a7fa9e7988a))
* add developer experience and safety tooling ([5904548](https://github.com/lgriffin/ESI.ts/commit/5904548e5a8507e8400879c8d3b2b5b180dcf4e2))
* add developer experience and safety tooling ([b7c4d5b](https://github.com/lgriffin/ESI.ts/commit/b7c4d5bcd8670524517bfe6093a2722291119ac8))
* add EsiResult&lt;T&gt; discriminated union and safeMode option ([9f1dc23](https://github.com/lgriffin/ESI.ts/commit/9f1dc2362d02a391ea854aebf21410a8744e1ffb))
* add Redocly CLI for ESI OpenAPI spec validation (v7.1.0) ([3b5d77d](https://github.com/lgriffin/ESI.ts/commit/3b5d77d5d812b51546137850af39309b5197c867))
* add retry with backoff, typed TimeoutError, and enhanced response metadata ([80cc90b](https://github.com/lgriffin/ESI.ts/commit/80cc90b05bcbd48c1b6d964b05efc9a0590e0401))
* add spec-driven type generation, spec-aware caching, and batch requests ([5fe4bee](https://github.com/lgriffin/ESI.ts/commit/5fe4bee18829633d7ac9cfa01f1222e7a3da9fd0))
* add write-operations, freelance-jobs, and universe-post examples ([8ed9a65](https://github.com/lgriffin/ESI.ts/commit/8ed9a6590093c01c4eb2aad50f6fa7521b4ede8d))
* add Zod runtime response validation for all ESI endpoints ([33946aa](https://github.com/lgriffin/ESI.ts/commit/33946aad00a698298e2382ff263f89c56bc38102))
* add Zod schemas for all 173 GET endpoints ([71aca82](https://github.com/lgriffin/ESI.ts/commit/71aca82e83701c50daee622bf3aff0e6f28acda7))
* branded ID types for type-safe entity references ([943cfd0](https://github.com/lgriffin/ESI.ts/commit/943cfd05d2b1d8f3ba6082190f04207138ffe036))
* compile-time spec-to-Zod type alignment checks ([9acf6e0](https://github.com/lgriffin/ESI.ts/commit/9acf6e0f145197f57dd0678eef1e0a414fb8c625))
* complete Zod schema coverage for all GET endpoints ([7339d14](https://github.com/lgriffin/ESI.ts/commit/7339d140e9396f3c57171ff1a597c7effe9055b7))
* enable noUncheckedIndexedAccess, noImplicitReturns, noImplicitOverride ([5617977](https://github.com/lgriffin/ESI.ts/commit/5617977a9a9241203991841ee05c3dd6a8d77d7d))
* endpoint coverage examples and wire format fixes (v6.1.0) ([7220d06](https://github.com/lgriffin/ESI.ts/commit/7220d06178b4a6b9b4fcd5cd8347a9233eb348bd))
* EsiResult&lt;T&gt; discriminated union and safeMode ([306d0b3](https://github.com/lgriffin/ESI.ts/commit/306d0b3068735201d72aa914fe268e7f2ea54a00))
* migrate from Swagger 2.0 to OpenAPI 3.1 (v7.0.0) ([91907ab](https://github.com/lgriffin/ESI.ts/commit/91907ab3c5ccfd61674e77cadcb7361c9aa46b91))
* overhaul BDD tests with jest-cucumber and Gherkin ([fc01c50](https://github.com/lgriffin/ESI.ts/commit/fc01c500b3fdd1d9f2bcef144e455c6f546caa21))
* overhaul BDD tests with jest-cucumber and Gherkin feature files ([77a283b](https://github.com/lgriffin/ESI.ts/commit/77a283b802418fd5cacdbfac0e8c85a6c7b2025a))
* per-group spec-driven rate limiting ([ef776cf](https://github.com/lgriffin/ESI.ts/commit/ef776cf1ad3ecd8cf5ba0e359389bd0f91e0863d))
* per-group spec-driven rate limiting with optional per-user bucketing ([d829551](https://github.com/lgriffin/ESI.ts/commit/d829551400dcf9895194dd7ed4af9eebea01291d))
* publish to GitHub Packages in release pipeline ([8fde4b5](https://github.com/lgriffin/ESI.ts/commit/8fde4b5703066f6026c0fa5fb0b8e1dce316fce6))
* Redocly CLI for ESI OpenAPI spec validation (v7.1.0) ([53b1886](https://github.com/lgriffin/ESI.ts/commit/53b18860a0f7298910ef7f2c49f163fd832f24b3))
* retry with backoff, typed TimeoutError, enhanced response metadata ([93550b2](https://github.com/lgriffin/ESI.ts/commit/93550b245e193531396184526d6046daf27cb37d))
* spec-driven type generation, spec-aware caching, and batch requests ([042447e](https://github.com/lgriffin/ESI.ts/commit/042447e0088ec0e5e371472c2c0063466fc9e6ca))
* streaming pagination via async generators ([6958284](https://github.com/lgriffin/ESI.ts/commit/6958284a85a564c7bd176896a5af17df0c49e450))
* streaming pagination via async generators on domain clients ([f0aadf3](https://github.com/lgriffin/ESI.ts/commit/f0aadf3b22903ea86e1188908ca275c8629e44e3))


### Fixed

* add fleet wing/squad name length validation and fix test parse errors ([8d283f4](https://github.com/lgriffin/ESI.ts/commit/8d283f4b1650b9cae51e0e573035c1acc0a57bd0))
* add missing system_id to MarketOrderSchema test data and update snapshot ([044ad11](https://github.com/lgriffin/ESI.ts/commit/044ad11b0d7bc20a4ffc27d63ac36629681e8746))
* add top-level [@emnapi](https://github.com/emnapi) entries to lockfile for Linux CI ([9158672](https://github.com/lgriffin/ESI.ts/commit/91586722edc07c3876d79f38ffff3a3ca1148c93))
* add write permissions to release workflow ([26b3c15](https://github.com/lgriffin/ESI.ts/commit/26b3c158876fd609188c8733c096ff24085891fc))
* align Zod schemas and examples with live ESI responses ([e4f1b05](https://github.com/lgriffin/ESI.ts/commit/e4f1b05c2f11f37c68ba6259dd95507719512ac8))
* align Zod schemas and examples with live ESI responses ([f15f78d](https://github.com/lgriffin/ESI.ts/commit/f15f78ddf5f0b32c5c9caab9e47c295d34c7777c))
* **ci:** exclude mock-irrelevant Schemathesis checks ([68e9f8a](https://github.com/lgriffin/ESI.ts/commit/68e9f8a495fcd6ddaf66a73a4f26fe8f7a81118a))
* **ci:** exclude status_code_conformance from Schemathesis checks ([15f2003](https://github.com/lgriffin/ESI.ts/commit/15f20033e7e1cb57abbcb56f4bf04563d80fcdb0))
* **ci:** fix Schemathesis API fuzz spec loading and readiness check ([9b6ee97](https://github.com/lgriffin/ESI.ts/commit/9b6ee97f64194b90cc6b8eefb6fa8115214ce443))
* **ci:** fix Schemathesis readiness check endpoint path ([f0973cc](https://github.com/lgriffin/ESI.ts/commit/f0973ccf4751d2c1e73401c917b46cf1aa827ec1))
* **ci:** handle remaining Prism mock artifacts in Schemathesis ([239be53](https://github.com/lgriffin/ESI.ts/commit/239be53e2d812f6bec6661b4c860b67b66289f84))
* **ci:** handle Schemathesis network errors gracefully ([8d7b366](https://github.com/lgriffin/ESI.ts/commit/8d7b36629cb75c4911a929a0b9b0fdc7c445ca12))
* **ci:** increase mutation testing concurrency and timeout ([c9e70ba](https://github.com/lgriffin/ESI.ts/commit/c9e70ba2e369cff6fff76c2759e932da3e69de84))
* **ci:** make schema drift detection a blocking CI check ([29a8dba](https://github.com/lgriffin/ESI.ts/commit/29a8dba68caef9d66213d13dc43434705747cbe1))
* **ci:** make schema drift detection a blocking CI check ([2eb1e41](https://github.com/lgriffin/ESI.ts/commit/2eb1e41b5209045b48d97cde8f0747e2f756198a))
* **ci:** make Schemathesis job informational, always exit 0 ([e81139b](https://github.com/lgriffin/ESI.ts/commit/e81139b5a097dcf932076014f34bd392e48ff0f8))
* **ci:** prevent Schemathesis timeout on large ESI spec ([270b5fc](https://github.com/lgriffin/ESI.ts/commit/270b5fc102e35f672c7f9a1a1972c8c1758c4347))
* **ci:** regenerate lockfile with npm 10 for CI compatibility ([e61483a](https://github.com/lgriffin/ESI.ts/commit/e61483ae40b5a8ce1a804a034e2b263e42270141))
* **ci:** relax Accept-Language enum in preprocessed spec ([d2df2a3](https://github.com/lgriffin/ESI.ts/commit/d2df2a327a93698181993d335a6a46942bb35ac9))
* **ci:** remove invalid --max-time flag from Schemathesis run ([42c0d1a](https://github.com/lgriffin/ESI.ts/commit/42c0d1aa859f5e622bb20a9a19f6c879040c6421))
* **ci:** remove Prism --errors flag ([5809f2c](https://github.com/lgriffin/ESI.ts/commit/5809f2c1c3e39240b3c00f0136d358b1847c4649))
* **ci:** resolve Schemathesis API fuzz gaps against Prism mock ([c4cbd7c](https://github.com/lgriffin/ESI.ts/commit/c4cbd7c1babf25e1e9d7bc30f8f923141d216683))
* **ci:** resolve Schemathesis API fuzz gaps against Prism mock ([27494d5](https://github.com/lgriffin/ESI.ts/commit/27494d50610bdc5f1435451aba4758cc3aadb217)), closes [#120](https://github.com/lgriffin/ESI.ts/issues/120)
* **ci:** restore workers auto, bump timeout to 20 minutes ([c2cf33c](https://github.com/lgriffin/ESI.ts/commit/c2cf33c50dda88830f9175f8c92d436e9da7538a))
* **ci:** strip int32 format from inline page parameters ([0f2dc2b](https://github.com/lgriffin/ESI.ts/commit/0f2dc2b1343a7fff3ee723f8468f7a881d010186))
* **ci:** update Schemathesis CLI flags for v4 ([c8ccad8](https://github.com/lgriffin/ESI.ts/commit/c8ccad850aba17a268e6b1f82267b3b1e2fd903d))
* correct POST body format for /universe/ids and /universe/names ([d1f1909](https://github.com/lgriffin/ESI.ts/commit/d1f1909e94ae312dc9af788426a077919139e967))
* correct POST body format for /universe/ids and /universe/names ([11b4f62](https://github.com/lgriffin/ESI.ts/commit/11b4f62b74a90bc2bc384e2b3cc88f719c8a8d00)), closes [#40](https://github.com/lgriffin/ESI.ts/issues/40)
* correct POST body format for asset and contact endpoints ([0be3712](https://github.com/lgriffin/ESI.ts/commit/0be3712f4349cd4f08dbc2c3046b7d4eaf04119d))
* correct POST body format for asset and contact endpoints ([dd8956e](https://github.com/lgriffin/ESI.ts/commit/dd8956ee33f1590e6140a9c64f90b9ef6b632f51)), closes [#56](https://github.com/lgriffin/ESI.ts/issues/56)
* correct wire format for contacts and UI endpoints ([28d3f31](https://github.com/lgriffin/ESI.ts/commit/28d3f31c2158e8775e9366f11365ba419412c7be))
* make API surface non-blocking, fix schemathesis --url flag ([31f2fdc](https://github.com/lgriffin/ESI.ts/commit/31f2fdcbf1af691ead5aca23c22016b2ddfa471b))
* make type generator idempotent for CI ([3203696](https://github.com/lgriffin/ESI.ts/commit/3203696a8f0196b0ef7b56a924d5df2a7ba6acf7))
* normalize CRLF in API surface check, fix schemathesis report perms ([eb7171a](https://github.com/lgriffin/ESI.ts/commit/eb7171a985fd5938907bc7e9f7a538fb8bdd3635))
* override lodash and fast-xml-parser to resolve high-severity audit ([4689661](https://github.com/lgriffin/ESI.ts/commit/46896614ff6bc0d2ca879975b7ad877f1e011150))
* reformat code for prettier 3.9 and fix lockfile sync ([d7151f6](https://github.com/lgriffin/ESI.ts/commit/d7151f6215dbbdf33a5372790385679a3576a4f8))
* regenerate API surface report and fix schemathesis flag ([111848f](https://github.com/lgriffin/ESI.ts/commit/111848f44d8bf9affca03036af8dd5fca24c3cef))
* regenerate API surface report, exclude from prettier ([6c13224](https://github.com/lgriffin/ESI.ts/commit/6c132248cbd94f3f6c451391f294e12f38543443))
* regenerate lockfile for cross-platform CI compatibility ([44766c2](https://github.com/lgriffin/ESI.ts/commit/44766c2e6a227d358efa119f19da99d101e719dd))
* regenerate lockfile for cross-platform CI compatibility ([d834b6d](https://github.com/lgriffin/ESI.ts/commit/d834b6da50b375cf0e6b0e25a65d1618e1735090))
* regenerate lockfile for cross-platform compatibility ([a059c06](https://github.com/lgriffin/ESI.ts/commit/a059c06ec95e6942d19cb27813b7f26de93d8b22))
* regenerate lockfile with npm 10 for CI compatibility ([0c9e880](https://github.com/lgriffin/ESI.ts/commit/0c9e880465aba516f4e32da9a00fc61d3be3ba6c))
* remove cross-env from contract:live script for CI compatibility ([e8be424](https://github.com/lgriffin/ESI.ts/commit/e8be424a7a503aa1fa7de4310ee8ebc82f23a9d7))
* remove sunset sovereignty endpoints ([fa139cb](https://github.com/lgriffin/ESI.ts/commit/fa139cbccf9180b20dc99943403aa2ac72f6c1c3))
* remove sunset sovereignty endpoints (map and structures) ([f0be888](https://github.com/lgriffin/ESI.ts/commit/f0be8880b4272ddb4443cd9a6eca678a4bebf63a)), closes [#53](https://github.com/lgriffin/ESI.ts/issues/53)
* replace deprecated schemathesis --junit-xml with --report ndjson ([fd1f748](https://github.com/lgriffin/ESI.ts/commit/fd1f748617cd7ca08d32c4c92d717cc363104299))
* replace process.cwd() fallback with require.resolve in configManager ([6512943](https://github.com/lgriffin/ESI.ts/commit/651294352052d29c5c069f9ce9e9893b48a48b25)), closes [#55](https://github.com/lgriffin/ESI.ts/issues/55)
* resolve API surface and schemathesis CI failures ([66eea7a](https://github.com/lgriffin/ESI.ts/commit/66eea7af818b25a4900581b210ff74e2645987f0))
* resolve API surface ordering and schemathesis report path issues ([0e5f580](https://github.com/lgriffin/ESI.ts/commit/0e5f5800d46eab169b23706b326c81b6cbb4a99a))
* resolve CI jobs failing with continue-on-error ([15d9fa4](https://github.com/lgriffin/ESI.ts/commit/15d9fa4f2383f678f07b07ea8b00554f253f423a))
* resolve merge conflict in run-schemathesis.sh ([bf90d7f](https://github.com/lgriffin/ESI.ts/commit/bf90d7f0017bb141e01f3255ca51ad50e632ce2d))
* resolve three CI jobs failing with continue-on-error ([38ad27d](https://github.com/lgriffin/ESI.ts/commit/38ad27dbe1a1d99c87ce13b60045cb1cf714c76b))
* restore [@emnapi](https://github.com/emnapi) lockfile entries for Linux CI ([84c054c](https://github.com/lgriffin/ESI.ts/commit/84c054c90919e5d97dd02267b558fe054edf14d2))
* restore [@emnapi](https://github.com/emnapi) lockfile entries stripped by Windows npm ([f9d42ac](https://github.com/lgriffin/ESI.ts/commit/f9d42ac072edd57063c5dab29d01347633c356ce))
* restore cross-platform lockfile with jest-cucumber added ([6fcae37](https://github.com/lgriffin/ESI.ts/commit/6fcae37349f8883703ceb1ea6675de2397cbc83b))
* **security:** add npm override for qs vulnerability (GHSA) ([8b73fd7](https://github.com/lgriffin/ESI.ts/commit/8b73fd73d5300c7b6dc1d8402808cf7ac23e2d6f))
* **security:** resolve CodeQL high-severity findings ([7f53aea](https://github.com/lgriffin/ESI.ts/commit/7f53aeaeade92d6b7df4bceee5f692a9aa89f78e))
* surgically restore [@emnapi](https://github.com/emnapi) packages pruned by windows npm ([dd79791](https://github.com/lgriffin/ESI.ts/commit/dd797915db050e3fe7e13f1139b70f344bc8cfd9))
* treat 420/429 as circuit breaker failures ([390d795](https://github.com/lgriffin/ESI.ts/commit/390d795bda5ebe411b905569cfd980beb364fc22))
* treat 420/429 rate-limit responses as circuit breaker failures ([5166e4c](https://github.com/lgriffin/ESI.ts/commit/5166e4c92a77d88aff3c8ed6de0610fbd99883ca)), closes [#54](https://github.com/lgriffin/ESI.ts/issues/54)
* update [@emnapi](https://github.com/emnapi) lockfile entries for cross-platform CI ([9b3dfa3](https://github.com/lgriffin/ESI.ts/commit/9b3dfa3c53d014292baa22f8b4aa34d4697be5b8))
* update integration test for spec-aware caching behavior ([813325c](https://github.com/lgriffin/ESI.ts/commit/813325cb08ff569e82f6b75170c1d58ec2feb04d))
* update integration test mock data for Zod schema validation ([0e65d34](https://github.com/lgriffin/ESI.ts/commit/0e65d3404b351667c0481726e0caf19771921f2c))
* update testPathPattern to testPathPatterns for jest 30 ([fbbf8f5](https://github.com/lgriffin/ESI.ts/commit/fbbf8f52c658f256e63894572f31dbdfc90edddd))
* use Rens instead of Jita for autopilot waypoint example ([01663ee](https://github.com/lgriffin/ESI.ts/commit/01663eeae7e2695ca47ae295d62ff09abbeb40c6))
* use require.resolve instead of process.cwd() in configManager ([930b02f](https://github.com/lgriffin/ESI.ts/commit/930b02f73ab73be5da8c77119e2c6ff987470835))
* use single-page fetch in streaming to avoid eager pagination ([05cb5da](https://github.com/lgriffin/ESI.ts/commit/05cb5dad4c92f4978b621717652fce0a244f1189))


### Changed

* add tooling, community docs, metadata, and security scanning ([ed4abce](https://github.com/lgriffin/ESI.ts/commit/ed4abce4f29d9fee7811c469efcee63d47a328e5))
* apply prettier formatting to entire codebase ([9deabce](https://github.com/lgriffin/ESI.ts/commit/9deabce214046fd8b85c19f821645551dd9c5dcd))
* apply prettier formatting to entire codebase ([a5c19d1](https://github.com/lgriffin/ESI.ts/commit/a5c19d10bea4c4966d3f36e6273b43cd97f174b4))
* bump version to 5.0.0 for release ([b2a6510](https://github.com/lgriffin/ESI.ts/commit/b2a651072520da3f96d8e3190479d20cb55e4de8))
* bump version to 5.2.0 ([69cb260](https://github.com/lgriffin/ESI.ts/commit/69cb260cb3df5fad7dc2977ac7803fcb75eb12f1))
* bump version to 6.1.0 ([6b338c4](https://github.com/lgriffin/ESI.ts/commit/6b338c4ce6e3502287c3e000aeb2162af2b837f6))
* bump version to 7.3.0 ([7dc6541](https://github.com/lgriffin/ESI.ts/commit/7dc65415bfe36e0a7f751daa3ee2932cb7799134))
* bump version to 7.4.0 and regenerate lockfile for CI ([0f212f9](https://github.com/lgriffin/ESI.ts/commit/0f212f983ec9fba9a80c39ffa9d69de1aa91cf5d))
* **ci:** bump actions/checkout from 4 to 7 ([5917986](https://github.com/lgriffin/ESI.ts/commit/59179867cc444d15c11624dd2a7697f9a8532ce3))
* **ci:** bump actions/checkout from 4 to 7 ([d14e51a](https://github.com/lgriffin/ESI.ts/commit/d14e51ab8544731dd04b1e12eb389d7c1c1d086a))
* **ci:** bump actions/setup-node from 4 to 6 ([32fdf7e](https://github.com/lgriffin/ESI.ts/commit/32fdf7ec896c109253b6b7f7ade93dd218822eee))
* **ci:** bump actions/setup-node from 4 to 6 ([f43ec22](https://github.com/lgriffin/ESI.ts/commit/f43ec22d6e0fe8980947c945ee23723b72b8d4c3))
* **ci:** bump actions/upload-artifact from 4 to 7 ([ac4405e](https://github.com/lgriffin/ESI.ts/commit/ac4405e9a6b7e1e80e3af35de91b98ebabd353eb))
* **ci:** bump actions/upload-artifact from 4 to 7 ([9f19f3e](https://github.com/lgriffin/ESI.ts/commit/9f19f3e186088324dc5713b99ee3c4d6cf2e2e4b))
* **ci:** bump github/codeql-action from 3 to 4 ([5371b2c](https://github.com/lgriffin/ESI.ts/commit/5371b2cee4f31f6318f762cd8cab9edc10d48ff6))
* **ci:** bump github/codeql-action from 3 to 4 ([d4d82fe](https://github.com/lgriffin/ESI.ts/commit/d4d82fe19aa35046a78dc69df72649e02adb6f92))
* **ci:** bump googleapis/release-please-action from 4 to 5 ([9f571e3](https://github.com/lgriffin/ESI.ts/commit/9f571e382ac89d0d153e0f34d52e82aafd2c7fc6))
* **ci:** bump peaceiris/actions-gh-pages from 3 to 4 ([a6dfbd2](https://github.com/lgriffin/ESI.ts/commit/a6dfbd2740361c28ca1182a860cb67a2c1bf29d9))
* **ci:** bump peaceiris/actions-gh-pages from 3 to 4 ([eccfd26](https://github.com/lgriffin/ESI.ts/commit/eccfd26b38cc1794a9b1c63931f3d667058902d6))
* **ci:** bump softprops/action-gh-release from 1 to 3 ([10a2629](https://github.com/lgriffin/ESI.ts/commit/10a2629bd579a78fa558f577247697d37c242b35))
* **ci:** bump softprops/action-gh-release from 1 to 3 ([75d574b](https://github.com/lgriffin/ESI.ts/commit/75d574b15a7806141b4edd1509c9c275edf8ce62))
* **deps:** bump @commitlint/cli from 19.8.1 to 21.0.2 ([06e96d2](https://github.com/lgriffin/ESI.ts/commit/06e96d2b3dcac4cb402f75f68ee8aacb75bfa9dd))
* **deps:** bump @commitlint/cli from 19.8.1 to 21.0.2 ([2fe6926](https://github.com/lgriffin/ESI.ts/commit/2fe69263a26b504bbe6ed50bb9f622f78ed36a52))
* **deps:** bump @commitlint/config-conventional from 19.8.1 to 21.1.0 ([59336ed](https://github.com/lgriffin/ESI.ts/commit/59336ed7ccf5bf14084cdcaca930690bd74b8476))
* **deps:** bump @types/node from 18.19.130 to 26.0.0 ([5fe02be](https://github.com/lgriffin/ESI.ts/commit/5fe02be48c4c09bdb491c7d6289077a7d3a0f799))
* **deps:** bump @types/node from 18.19.130 to 26.0.0 ([79bf37c](https://github.com/lgriffin/ESI.ts/commit/79bf37c478522a02dad5a99631039a868bcf80e5))
* **deps:** bump eslint-config-prettier from 9.1.2 to 10.1.8 ([cb357fb](https://github.com/lgriffin/ESI.ts/commit/cb357fbd77cac0254f9e07a7802abe6420074ad4))
* **deps:** bump eslint-config-prettier from 9.1.2 to 10.1.8 ([012bcea](https://github.com/lgriffin/ESI.ts/commit/012bceadb1bd73dcbe8e66d887a901e715eec40d))
* **deps:** bump jest-junit from 16.0.0 to 17.0.0 ([c4d51c1](https://github.com/lgriffin/ESI.ts/commit/c4d51c1f189273a8db19260a590fb8a380a63776))
* **deps:** bump jest-junit from 16.0.0 to 17.0.0 ([e8e91df](https://github.com/lgriffin/ESI.ts/commit/e8e91df6571e984f238c19f44f3ae43c36b20034))
* **deps:** bump lint-staged from 16.4.0 to 17.0.8 ([3ab7d87](https://github.com/lgriffin/ESI.ts/commit/3ab7d87b74d3338a32e3f104a0c05a381c5bd847))
* **deps:** bump lint-staged from 16.4.0 to 17.0.8 ([003b6b2](https://github.com/lgriffin/ESI.ts/commit/003b6b25927d074abb3232f6b07b6e2d5b7bacf4))
* **deps:** bump the minor-and-patch group across 1 directory with 4 updates ([be89ab1](https://github.com/lgriffin/ESI.ts/commit/be89ab1c6c03b218d3f1f6573f02395edb7966d9))
* **deps:** bump the minor-and-patch group across 1 directory with 4 updates ([efd6e23](https://github.com/lgriffin/ESI.ts/commit/efd6e23e2ddc315f74f9851c8c92ecbe99e131fe))
* **deps:** bump the minor-and-patch group across 1 directory with 6 updates ([df79242](https://github.com/lgriffin/ESI.ts/commit/df792427eb640dd19dc7f8b85ad45fb30dabca8e))
* **deps:** bump the minor-and-patch group across 1 directory with 6 updates ([73b443a](https://github.com/lgriffin/ESI.ts/commit/73b443a97ba1996c844ec4de9ab8cbb759d47666))
* **deps:** bump the minor-and-patch group with 10 updates ([7fba79f](https://github.com/lgriffin/ESI.ts/commit/7fba79fe6f16776e298c30224f60429dfcec2559))
* **deps:** bump the minor-and-patch group with 4 updates ([1261719](https://github.com/lgriffin/ESI.ts/commit/1261719afa2f10bdefd60aa506cc70327a79c7d4))
* **deps:** bump the minor-and-patch group with 4 updates ([57cad07](https://github.com/lgriffin/ESI.ts/commit/57cad0708264c3f56cf6a8b2ce6b376b6be69321))
* **deps:** bump the testing group across 1 directory with 2 updates ([7d9433d](https://github.com/lgriffin/ESI.ts/commit/7d9433d22ce33117046b65ff9d64088d7556b722))
* **deps:** bump the testing group across 1 directory with 2 updates ([95ad33c](https://github.com/lgriffin/ESI.ts/commit/95ad33c704cc447a3f77566be676c6a9f4b58ee3))
* **deps:** upgrade @typescript-eslint/* to v8 and group dependabot deps ([c054b3e](https://github.com/lgriffin/ESI.ts/commit/c054b3e0784035f7871a4a0c27b279d2bfc73ea1))
* **deps:** upgrade @typescript-eslint/* to v8 and group dependabot deps ([92d7975](https://github.com/lgriffin/ESI.ts/commit/92d7975359491a30ad49d205581a885e6ccf0324))
* fix knip false positives ([b06aa22](https://github.com/lgriffin/ESI.ts/commit/b06aa226d4080a9f2eeff1a735d03b425ecb95ec))
* fix knip false positives ([b894c58](https://github.com/lgriffin/ESI.ts/commit/b894c58ed53b9b9400a5af23cf2a76f9bc644103))
* modernize dependencies, migrate ESLint to v10 flat config, sweep tech debt ([752377e](https://github.com/lgriffin/ESI.ts/commit/752377e0a1564414a687e74bd2505655da64a349))
* modernize deps, ESLint 10 flat config, tech debt sweep ([a3bdfd4](https://github.com/lgriffin/ESI.ts/commit/a3bdfd4c29ab6a7785cddced36331e863c1ffe66))
* regenerate types and API surface report ([736d45d](https://github.com/lgriffin/ESI.ts/commit/736d45da6bdcf72dabae5c9324d3c69d87480aad))
* release 7.4.0 ([ee08eba](https://github.com/lgriffin/ESI.ts/commit/ee08eba701b751e109bd4608e02b944ee5babccf))
* release v7.2.0 ([0ee91ab](https://github.com/lgriffin/ESI.ts/commit/0ee91ab8de96fbf903b4786de40231470f129b95))
* remove unused getHeaders test helper ([b5a17c1](https://github.com/lgriffin/ESI.ts/commit/b5a17c1d029c18fcd92f3df7a6dbf53f12b9baaa))
* remove unused getHeaders test helper ([7f3b39e](https://github.com/lgriffin/ESI.ts/commit/7f3b39e79d1dfc1f4328018728e91969870268ac)), closes [#58](https://github.com/lgriffin/ESI.ts/issues/58)


### Documentation

* add live output examples for all 10 new endpoint coverage files ([b4d7703](https://github.com/lgriffin/ESI.ts/commit/b4d7703e2bf386551be3980da9cbdccc32119d5d))
* add retry-timeout-metadata example ([d91f165](https://github.com/lgriffin/ESI.ts/commit/d91f165b7eb2c05619f8dc7b666111597e6877e3))
* add tests, README, changelog, and guide updates for new features ([2d54a00](https://github.com/lgriffin/ESI.ts/commit/2d54a00aa828ccba45db37ffa55e695e6513bb77))
* clarify endpoint count — 208 total, 185 public ESI + 23 newer EVE features ([0913e54](https://github.com/lgriffin/ESI.ts/commit/0913e54c34e2307ff2366c92aba27d9e14782c35))
* comprehensive examples guide with captured console output ([60f8a99](https://github.com/lgriffin/ESI.ts/commit/60f8a99f415c3605c80afe84d7981c748fc570e1))
* comprehensive examples guide with live console output ([1be8bb5](https://github.com/lgriffin/ESI.ts/commit/1be8bb5fbdab7e8b5bb1437f0609dce659eb4f79))
* fix endpoint count to 194 public + 14 newer EVE features ([38524cc](https://github.com/lgriffin/ESI.ts/commit/38524cc06a36d335d3fede43751b6991ae8995db))
* fix testing doc sections reverted by lint-staged ([7d64915](https://github.com/lgriffin/ESI.ts/commit/7d649156744089d87eb66f478ee4c330c7d481e6))
* rewrite README and update docs for v6.1.0 ([1f757b5](https://github.com/lgriffin/ESI.ts/commit/1f757b51177e64ffcd73bbddd8cff5a78d8f43f8))
* update guides and apply EARS patterns to BDD tests ([da4ec46](https://github.com/lgriffin/ESI.ts/commit/da4ec4671a9d95bd9c4a89da322aaadf41b6ff38))
* update guides with comprehensive testing stats and add security guide ([89674ec](https://github.com/lgriffin/ESI.ts/commit/89674ecd6947fa18bbd6a03fc118fa78bb5d1085))
* update guides with testing stats and add security guide ([7b1499e](https://github.com/lgriffin/ESI.ts/commit/7b1499ebc7c3c76ce6c305a2c6a9a97ebf2fe16a))
* update README and guides for v5.1.0 accuracy ([c00cf54](https://github.com/lgriffin/ESI.ts/commit/c00cf5437af0627752afd048daf83b6dbfdb805f))
* update testing documentation for new test categories ([96289d8](https://github.com/lgriffin/ESI.ts/commit/96289d874c8ddbb3c380a7e4f5e439c142be031a))
* update testing documentation for new test categories ([97a679d](https://github.com/lgriffin/ESI.ts/commit/97a679d7129d5646f37c3c0ad0304f3f64754583))


### Testing

* add ClientRegistry coverage for all 35 client types ([25a8a57](https://github.com/lgriffin/ESI.ts/commit/25a8a572cb525d4f89ee80fd032964e3976ed9a1))
* add ClientRegistry coverage for all client type factories ([5651265](https://github.com/lgriffin/ESI.ts/commit/56512652ceb81c5f22158ccaed08775c4ae51889)), closes [#57](https://github.com/lgriffin/ESI.ts/issues/57)
* add comprehensive test coverage across resilience, security, config, API surface, and live ESI ([e6f41a0](https://github.com/lgriffin/ESI.ts/commit/e6f41a0221d4a44c329d46252608c2a80c1e4b3c))
* apply EARS (Easy Approach to Requirements Syntax) patterns to all BDD tests ([1b5be2a](https://github.com/lgriffin/ESI.ts/commit/1b5be2ad6d7b73dcf258b3f8fbcab921120dcaa5))
* close comprehensive testing gaps (+1233 tests) ([be9e882](https://github.com/lgriffin/ESI.ts/commit/be9e882cfaed2a0fa161422ab9b27df8ec544e2c))
* close comprehensive testing gaps (+1233 tests) ([850add3](https://github.com/lgriffin/ESI.ts/commit/850add3be0814c945e573a6586a8878c3b40fa48))
* comprehensive test coverage expansion (+279 tests) ([153aabb](https://github.com/lgriffin/ESI.ts/commit/153aabbc9f7346ac5bf052b1021b77ccb1d346d9))
* expand type-level tests for error guards, endpoints, and domain types ([b47c876](https://github.com/lgriffin/ESI.ts/commit/b47c876d8ce59dd9ef4960a7e816992ed807269b))
* expand type-level tests with tsd ([f6d40dc](https://github.com/lgriffin/ESI.ts/commit/f6d40dc0da84b28c4516f37d70097cc3cad96761))
* raise coverage from 75% to 91%+ ([be45987](https://github.com/lgriffin/ESI.ts/commit/be45987e8652a53a3a6e5dd22af9abccf11ec8e2))
* raise coverage from 75% to 91%+ with comprehensive test additions ([28be9f5](https://github.com/lgriffin/ESI.ts/commit/28be9f59a4cfe3eb72757af7f0959e9472d8c422))

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
