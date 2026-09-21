# Graph Report - ESI.ts-rw-graphify (2026-09-21)

## Corpus Check

- cluster-only mode — file stats not available

## Summary

- 6799 nodes · 18274 edges · 275 communities (205 shown, 70 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 233 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `60e72acf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)

- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 138
- Community 139
- Community 140
- Community 141
- Community 142
- Community 143
- Community 144
- Community 145
- Community 146
- Community 147
- Community 148
- Community 149
- Community 150
- Community 151
- Community 152
- Community 153
- Community 154
- Community 155
- Community 156
- Community 157
- Community 158
- Community 159
- Community 160
- Community 161
- Community 162
- Community 163
- Community 164
- Community 165
- Community 166
- Community 167
- Community 168
- Community 169
- Community 170
- Community 171
- Community 172
- Community 173
- Community 174
- Community 175
- Community 176
- Community 177
- Community 178
- Community 179
- Community 180
- Community 181
- Community 182
- Community 183
- Community 184
- Community 185
- Community 186
- Community 187
- Community 188
- Community 189
- Community 190
- Community 191
- Community 192
- Community 193
- Community 194
- Community 195
- Community 196
- Community 197
- Community 198
- Community 199
- Community 200
- Community 201
- Community 202
- Community 203
- Community 204
- Community 205
- Community 206
- Community 207
- Community 208
- Community 209
- Community 210
- Community 211
- Community 212
- Community 213
- Community 214
- Community 215
- Community 216
- Community 217
- Community 218
- Community 219
- Community 220
- Community 221
- Community 222
- Community 223
- Community 224
- Community 225
- Community 226
- Community 227
- Community 228
- Community 230
- Community 232
- Community 233
- Community 249
- Community 254

## God Nodes (most connected - your core abstractions)

1. `EsiClient` - 244 edges
2. `ApiClient` - 238 edges
3. `scripts` - 190 edges
4. `queueResponse()` - 153 edges
5. `EsiError` - 145 edges
6. `Given()` - 132 edges
7. `Then()` - 130 edges
8. `When()` - 129 edges
9. `zod` - 128 edges
10. `SdeDataProvider` - 120 edges

## Surprising Connections (you probably didn't know these)

- `Case` --references--> `EndpointDefinition` [EXTRACTED]
  tests/faults/payload-fuzz.nightly.test.ts → src/core/endpoints/EndpointDefinition.ts
- `World` --references--> `EsiClient` [EXTRACTED]
  tests/tdd/composition/errorLimit.test.ts → src/EsiClient.ts
- `World` --references--> `EsiClient` [EXTRACTED]
  tests/tdd/composition/retryCircuit.test.ts → src/EsiClient.ts
- `ReplayReport` --references--> `EsiValidationError` [EXTRACTED]
  tests/contract/recorded/replay.ts → src/core/util/error.ts
- `World` --references--> `EsiClient` [EXTRACTED]
  tests/tdd/composition/writeInvalidation.test.ts → src/EsiClient.ts

## Import Cycles

- 3-file cycle: `src/core/ApiClient.ts -> src/core/IRetryStrategy.ts -> src/core/RetryStrategy.ts -> src/core/ApiClient.ts`
- 4-file cycle: `src/core/ApiClient.ts -> src/core/IRetryStrategy.ts -> src/core/RetryStrategy.ts -> src/core/circuitBreaker/CircuitBreaker.ts -> src/core/ApiClient.ts`
- 5-file cycle: `src/core/ApiClient.ts -> src/core/IRetryStrategy.ts -> src/core/RetryStrategy.ts -> src/core/util/error.ts -> src/core/circuitBreaker/CircuitBreaker.ts -> src/core/ApiClient.ts`

## Communities (275 total, 70 thin omitted)

### Community 0 - "Community 0"

Cohesion: 0.01
Nodes (190): scripts, api-report, api-report:check, api-report:semver, audit:check, audit:diff, bdd, bdd:access-lists (+182 more)

### Community 1 - "Community 1"

Cohesion: 0.03
Nodes (76): jest-cucumber, EsiError, isValidationError(), sanitizeUrl(), SENSITIVE_PARAMS, TimeoutError, feature, feature (+68 more)

### Community 2 - "Community 2"

Cohesion: 0.03
Nodes (107): jest-fetch-mock, Config, getConfig(), getDirname(), loadConfig(), client, config, rateLimiter (+99 more)

### Community 3 - "Community 3"

Cohesion: 0.02
Nodes (84): main(), main(), main(), main(), main(), main(), displayCharacterProfile(), getCompleteCharacterProfile() (+76 more)

### Community 4 - "Community 4"

Cohesion: 0.01
Nodes (144): src_schemas_index_accesslistentryschema, src_schemas_index_accesslistschema, src_schemas_index_agentresearchschema, src_schemas_index_alliancecontactlabelschema, src_schemas_index_alliancecontactschema, src_schemas_index_allianceiconschema, src_schemas_index_allianceinfoschema, src_schemas_index_ancestryschema (+136 more)

### Community 5 - "Community 5"

Cohesion: 0.04
Nodes (76): AccessListsClient, BaseEsiClient, ClientMethods, ClonesClient, CosmeticsClient, IncursionsClient, InsuranceClient, RouteClient (+68 more)

### Community 6 - "Community 6"

Cohesion: 0.03
Nodes (73): UniverseClient, AncestrySchema, AsteroidBeltInfoSchema, BloodlineSchema, BulkIdResultSchema, ConstellationInfoSchema, FactionSchema, GraphicInfoSchema (+65 more)

### Community 7 - "Community 7"

Cohesion: 0.04
Nodes (35): allianceFixtures, allianceMatches, alliancePaths, GOONSWARM_ALLIANCE_ID, LATENCY_BUDGET_MS, LATENCY_DELAY_MS, STALLED_DELAY_MS, STALLED_TIMEOUT_MS (+27 more)

### Community 8 - "Community 8"

Cohesion: 0.03
Nodes (15): ApiClient, IDeduplicator, IRetryStrategy, MiddlewareManager, RequestContext, RequestInterceptor, ResponseContext, ResponseInterceptor (+7 more)

### Community 9 - "Community 9"

Cohesion: 0.02
Nodes (84): AccountingEntryTypeSchema, AgentInSpaceSchema, AgentTypeSchema, AppliedProximityEffectSchema, ArchetypeSchema, BlueprintActivitiesSchema, BlueprintActivitySchema, BlueprintMaterialSchema (+76 more)

### Community 10 - "Community 10"

Cohesion: 0.05
Nodes (22): RFC-9110, EsiDatasource, handleRequest(), src_core_endpoints_esi_rate_limit_groups_generated, src_core_endpoints_esi_rate_limit_groups_generated_esiratelimitgroups, RateLimitGroupStatus, DEFAULT_ERROR_LIMIT, ErrorLimitState (+14 more)

### Community 11 - "Community 11"

Cohesion: 0.05
Nodes (17): SdeTestDataFactory, Blueprint, DogmaAttribute, EveCategory, Faction, Graphic, Icon, Race (+9 more)

### Community 12 - "Community 12"

Cohesion: 0.09
Nodes (41): executeRequest(), handleSinglePageRequest(), CircuitOpenError, CircuitRecord, Level, logError, logInfo, logWarn (+33 more)

### Community 13 - "Community 13"

Cohesion: 0.06
Nodes (66): BASELINE_PATH, beadArg, ciMode, ENDPOINTS_DIR, EXCEPTIONS_PATH, loadBaseBaseline(), loadBaseline(), loadExceptions() (+58 more)

### Community 14 - "Community 14"

Cohesion: 0.06
Nodes (12): TokenProvider, CircuitBreakerConfig, ApiClientType, ClientInstance, createClientInstance(), RateLimiterConfig, EsiClientConfig, CustomEsiClient (+4 more)

### Community 15 - "Community 15"

Cohesion: 0.04
Nodes (37): AllianceClient, MercenaryClient, SkyhooksClient, contactEndpoints, AllianceContact, AllianceContactLabel, AllianceIcon, AllianceInfo (+29 more)

### Community 16 - "Community 16"

Cohesion: 0.05
Nodes (21): ContactsClient, IndustryClient, PageResult, src_types_api_responses_corporationindustryjob, src_types_api_responses_industryfacility, src_types_api_responses_industryjob, src_types_api_responses_industrysystem, src_types_api_responses_miningledgerentry (+13 more)

### Community 17 - "Community 17"

Cohesion: 0.07
Nodes (59): main(), REPORT, ROOT, changedAndTracked(), chooseBaselineShard(), git(), main(), mutatePatterns() (+51 more)

### Community 18 - "Community 18"

Cohesion: 0.04
Nodes (48): CorporationProjectsClient, MilitaryCampaignsClient, src_index_allianceicon, src_index_allianceinfo, src_index_characterinfo, src_index_charactermilitarycampaignobjective, src_index_characterportrait, src_index_contract (+40 more)

### Community 19 - "Community 19"

Cohesion: 0.03
Nodes (8): Certificate, CloneGrade, EpicArc, PlanetSchematic, Region, School, StationOperation, StationService

### Community 20 - "Community 20"

Cohesion: 0.06
Nodes (41): calendarEndpoints, characterEndpoints, cloneEndpoints, contractEndpoints, corporationEndpoints, dogmaEndpoints, EndpointMap, fittingEndpoints (+33 more)

### Community 21 - "Community 21"

Cohesion: 0.07
Nodes (30): zod, accessListEndpoints, assetEndpoints, fleetEndpoints, incursionEndpoints, insuranceEndpoints, loyaltyEndpoints, piEndpoints (+22 more)

### Community 22 - "Community 22"

Cohesion: 0.09
Nodes (59): AccountingEntryType, AppliedProximityEffect, Archetype, BlueprintActivities, BlueprintActivity, BlueprintMaterial, BlueprintProduct, CharacterTitle (+51 more)

### Community 23 - "Community 23"

Cohesion: 0.09
Nodes (20): Given(), CITADEL_ID, CONCURRENT_SYSTEM_IDS, ENTITY_IDS, EXPLORATION, JITA, JITA_IV_ID, JITA_POSITION (+12 more)

### Community 24 - "Community 24"

Cohesion: 0.05
Nodes (46): FittingsClient, UiClient, src_core_clientregistry_accesslistsclient, src_core_clientregistry_allianceclient, src_core_clientregistry_assetsclient, src_core_clientregistry_calendarclient, src_core_clientregistry_characterclient, src_core_clientregistry_characterskillsclient (+38 more)

### Community 25 - "Community 25"

Cohesion: 0.08
Nodes (30): buildCacheKey(), buildDedupeKey(), scopeToIdentity(), ICache, logDebug, cacheResponse(), currentWriteGeneration(), evictRejectedResponse() (+22 more)

### Community 26 - "Community 26"

Cohesion: 0.05
Nodes (12): CorporationsClient, ContainerLog, CorporationFacility, CorporationIssuedMedal, CorporationMedal, CorporationMemberRole, CorporationMemberTitle, CorporationRoleHistory (+4 more)

### Community 27 - "Community 27"

Cohesion: 0.05
Nodes (6): MemorySdeProvider, Moon, NpcCorporation, NpcStation, SkinLicense, Stargate

### Community 28 - "Community 28"

Cohesion: 0.05
Nodes (6): FITTING_ATTRIBUTES, SdeDataProvider, AgentInSpace, NpcCharacter, Planet, SecondarySun

### Community 29 - "Community 29"

Cohesion: 0.04
Nodes (50): author, bugs, url, description, engines, node, files, homepage (+42 more)

### Community 30 - "Community 30"

Cohesion: 0.12
Nodes (12): requestBody(), CUSTOM_LABEL_ID, EMPTY_INBOX_CHARACTER_ID, lastRequestBody(), MAIL_CHARACTER_ID, MAIL_ID, mailFixtures, mailHeadersMatch() (+4 more)

### Community 31 - "Community 31"

Cohesion: 0.10
Nodes (47): Args, fail(), judgeRoot(), CaseOutputs, checkVersionBump(), EvalManifest, EvalManifestCase, evaluateRegexGrader() (+39 more)

### Community 32 - "Community 32"

Cohesion: 0.07
Nodes (42): ref_os, ATTW_CLI, ATTW_RESOLUTION_KINDS, attwFindings(), AttwJson, BaseBaseline, Baseline, BASELINE_PATH (+34 more)

### Community 33 - "Community 33"

Cohesion: 0.07
Nodes (24): AdvanceClock, assertSameStates(), Attempt, BreakerFactory, breakerProperty(), Burst, circuit(), commandsFor() (+16 more)

### Community 34 - "Community 34"

Cohesion: 0.06
Nodes (45): checkFile(), camelCase(), checkRuleTitle(), collectSchemaObjects(), domainOfFeature(), endpointFileCandidates(), EndpointLike, ENDPOINTS_DIR (+37 more)

### Community 35 - "Community 35"

Cohesion: 0.07
Nodes (10): ETagCacheConfig, ETagCacheManager, CacheEntry, ConfigureApiClientResult, CacheStats, CircuitBreakerStats, EsiDiagnostics, RequestDeduplicator (+2 more)

### Community 36 - "Community 36"

Cohesion: 0.05
Nodes (5): TestDataFactory, AccessListEntry, corporationRecord(), squadMember(), orderBook()

### Community 37 - "Community 37"

Cohesion: 0.06
Nodes (10): MemorySdeData, DogmaEffect, DogmaUnit, Dungeon, Mission, NotificationType, Skin, TypeBonus (+2 more)

### Community 38 - "Community 38"

Cohesion: 0.07
Nodes (36): FAULTS, target(), WEAK_FAULT, KNOWN_GAPS, KNOWN_GAPS_PATH, knownGapFor(), parseKnownGaps(), useVirtualClock() (+28 more)

### Community 39 - "Community 39"

Cohesion: 0.04
Nodes (47): devDependencies, adm-zip, @arethetypeswrong/cli, better-sqlite3, @commitlint/cli, @commitlint/config-conventional, @cucumber/gherkin, @cucumber/messages (+39 more)

### Community 40 - "Community 40"

Cohesion: 0.06
Nodes (19): MarketClient, src_types_api_responses_charactermarketorder, src_types_api_responses_charactermarketorderhistory, src_types_api_responses_corporationmarketorder, src_types_api_responses_corporationmarketorderhistory, src_types_api_responses_marketgroup, src_types_api_responses_markethistory, src_types_api_responses_marketorder (+11 more)

### Community 41 - "Community 41"

Cohesion: 0.08
Nodes (28): locationEndpoints, marketEndpoints, statusEndpoints, CharacterLocationSchema, CharacterOnlineSchema, CharacterShipSchema, CharacterMarketOrderHistorySchema, CharacterMarketOrderSchema (+20 more)

### Community 42 - "Community 42"

Cohesion: 0.09
Nodes (36): checkWarnOnlyList(), annotate(), auditFeature(), auditRule(), auditScenario(), auditTags(), Beads, BEADS_EXPORT_PATH (+28 more)

### Community 43 - "Community 43"

Cohesion: 0.14
Nodes (10): balanceMatch(), BROKE_CHARACTER_ID, FUNDED_BALANCE, MASTER_DIVISION, NEW_CHARACTER_ID, SINGLE_PAGE, WALLET_CHARACTER_ID, WALLET_CORPORATION_ID (+2 more)

### Community 44 - "Community 44"

Cohesion: 0.07
Nodes (29): ref_fs, ref_path, ref_url, MIRRORED_SECTIONS, mirrorProblems(), sectionsOf(), ENV_FILE, main() (+21 more)

### Community 45 - "Community 45"

Cohesion: 0.11
Nodes (20): Emit, logFatal, logTrace, defaultLogger, LogLevel, ILogger, LogContext, ctx() (+12 more)

### Community 46 - "Community 46"

Cohesion: 0.08
Nodes (33): corporationProjectEndpoints, militaryCampaignEndpoints, CorporationProjectContributionSchema, CorporationProjectContributorSchema, CorporationProjectContributorsListingSchema, CorporationProjectCursorSchema, CorporationProjectSchema, CorporationProjectsListingSchema (+25 more)

### Community 47 - "Community 47"

Cohesion: 0.13
Nodes (35): buildAndPack(), step(), annotate(), BaseBaseline, Baseline, BASELINE_PATH, BaselineProblems, checkBaseline() (+27 more)

### Community 48 - "Community 48"

Cohesion: 0.12
Nodes (28): feature, mockDelayedSsoResponses(), base64url(), DEFAULT_CHARACTER_ID, DEFAULT_CHARACTER_NAME, DEFAULT_SCOPES, FakeJwtClaims, isSsoTokenRequest() (+20 more)

### Community 49 - "Community 49"

Cohesion: 0.10
Nodes (33): arg(), ANSI, buildLedger(), caseName(), cell(), EXECUTED, FeatureSource, firstLine() (+25 more)

### Community 50 - "Community 50"

Cohesion: 0.14
Nodes (12): queueNoContent(), CONCURRENT_REGIONS, DOMAIN, HEIMATAR, LARGE_ORDER_BOOK_SIZE, marketFixtures, marketPaths, PYERITE (+4 more)

### Community 51 - "Community 51"

Cohesion: 0.08
Nodes (28): autoFetchAll(), fetchFirstPage(), fetchJobDetail(), main(), manualCursorPagination(), pollingPattern(), FreelanceJobsClient, StatusClient (+20 more)

### Community 52 - "Community 52"

Cohesion: 0.08
Nodes (18): adm-zip, js-yaml, ref_node_fs, ref_node_os, ref_node_path, CliOptions, log(), main() (+10 more)

### Community 53 - "Community 53"

Cohesion: 0.12
Nodes (33): BASELINE_PATH, applyRatchet(), BaseBaseline, scripts_determinism_lint_core_clock_modules, collectSites(), scripts_determinism_lint_core_constructs, CountDelta, countSites() (+25 more)

### Community 54 - "Community 54"

Cohesion: 0.13
Nodes (8): ACTIVE_WAR_ID, EMPTY_WAR_ID, FINISHED_WAR_ID, MUTUAL_WAR_ID, UNKNOWN_WAR_ID, warFixtures, warMatches, warPaths

### Community 55 - "Community 55"

Cohesion: 0.09
Nodes (30): Cell, CellOptions, CellResult, CELLS, cellTsconfig(), DOCUMENTED_SUBPATHS, EsbuildLike, importTarget() (+22 more)

### Community 56 - "Community 56"

Cohesion: 0.07
Nodes (29): DeprecationInfo, EndpointArgs, HttpMethod, PathParamArgs, sovereigntyEndpoints, src_index_esiresponse, src_index_esiresponsemeta, src_index_esiresult (+21 more)

### Community 57 - "Community 57"

Cohesion: 0.12
Nodes (32): assertSameIds(), CursorPageSpec, cursorProperty(), dropsLastPage, eagerProperty(), exhaustedPageProperty(), fetchAllInArrivalOrder, fetchAllProperty() (+24 more)

### Community 58 - "Community 58"

Cohesion: 0.10
Nodes (34): buildSpecUrl(), CacheTtlEntry, EndpointScopeEntry, extractAllScopes(), extractCacheTtls(), extractEndpointScopes(), extractRateLimitGroups(), GeneratedInterface (+26 more)

### Community 59 - "Community 59"

Cohesion: 0.12
Nodes (34): EndpointConcept, EndpointRef, escapeYaml(), extractEndpoints(), extractSchemas(), formatDuration(), formatWindowMs(), generateBundleIndex() (+26 more)

### Community 60 - "Community 60"

Cohesion: 0.06
Nodes (5): Ancestry, Bloodline, Constellation, EveGroup, SDE_DIR

### Community 61 - "Community 61"

Cohesion: 0.10
Nodes (19): annotate(), BDD_ROOT, bindFeature(), FeaturePlan, FEATURES_ROOT, filesUnder(), loadStepLibrary(), PlannedRule (+11 more)

### Community 62 - "Community 62"

Cohesion: 0.06
Nodes (33): allianceEndpointScaffold, assetsEndpointScaffold, calendarEndpointScaffold, characterEndpointScaffold, clonesEndpointScaffold, contactsEndpointScaffold, contractsEndpointScaffold, corporationEndpointScaffold (+25 more)

### Community 63 - "Community 63"

Cohesion: 0.13
Nodes (30): analyseExportCoverage(), AnalyseOptions, applyBaseline(), BaseBaseline, BASELINE_FILE, collectBindingNames(), collectTestFiles(), declarationTargets() (+22 more)

### Community 64 - "Community 64"

Cohesion: 0.09
Nodes (7): CharacterClient, AgentResearch, CharacterTitle, CorporationHistory, Medal, Notification, Standing

### Community 65 - "Community 65"

Cohesion: 0.10
Nodes (26): CapturedRequest, captureRequest(), main(), option(), Outcome, politeFetch(), recordOne(), RunAborted (+18 more)

### Community 66 - "Community 66"

Cohesion: 0.08
Nodes (7): main(), printTree(), IStaticDataProvider, DogmaAttributeCategory, EveType, MarketGroup, SolarSystem

### Community 67 - "Community 67"

Cohesion: 0.13
Nodes (28): ref_child_process, arg(), API_REPORT_PATH, compatibleReason(), countLines(), diffReports(), evaluateGate(), GateOptions (+20 more)

### Community 68 - "Community 68"

Cohesion: 0.10
Nodes (9): FileTokenStorage, FileTokenStorageOptions, isStoredToken(), isStringArray(), TokenFile, MemoryTokenStorage, ITokenStorage, StoredToken (+1 more)

### Community 69 - "Community 69"

Cohesion: 0.13
Nodes (25): RFC-6749, AddCharacterOptions, CharacterSummary, EsiTokenManagerConfig, ManagedClientConfig, RefreshAllOptions, RefreshResult, RefreshStatus (+17 more)

### Community 70 - "Community 70"

Cohesion: 0.06
Nodes (25): devDependencies, vitepress, vue, name, private, scripts, build, dev (+17 more)

### Community 71 - "Community 71"

Cohesion: 0.09
Nodes (5): CircuitBreaker, CircuitState, ICircuitBreaker, CircuitModel, Real

### Community 72 - "Community 72"

Cohesion: 0.10
Nodes (13): ContractsClient, src_types_api_responses_contract, src_types_api_responses_contractbid, src_types_api_responses_contractitem, src_types_api_responses_publiccontract, src_types_api_responses_publiccontractbid, src_types_api_responses_publiccontractitem, Contract (+5 more)

### Community 73 - "Community 73"

Cohesion: 0.17
Nodes (22): allianceEndpoints, AllianceContactLabelSchema, AllianceContactSchema, AllianceIconSchema, AllianceInfoSchema, AgentResearchSchema, BlueprintSchema, CharacterAffiliationSchema (+14 more)

### Community 74 - "Community 74"

Cohesion: 0.15
Nodes (9): CHAINED_KILLMAIL, CORPORATION_ID, killmailFixtures, killmailPaths, MISMATCHED_KILLMAIL, MULTI_ATTACKER_KILLMAIL, PILOT_CHARACTER_ID, QUIET_CHARACTER_ID (+1 more)

### Community 75 - "Community 75"

Cohesion: 0.14
Nodes (25): COMPOSITES, duplicateScripts(), duration(), exitCodeFor(), NOT_RUN_LOCALLY, renderSummary(), scriptsInWorkflow(), selectTiers() (+17 more)

### Community 76 - "Community 76"

Cohesion: 0.09
Nodes (9): FleetClient, src_types_api_responses_characterfleetinfo, src_types_api_responses_fleetinfo, src_types_api_responses_fleetmember, src_types_api_responses_fleetwing, CharacterFleetInfo, FleetInfo, FleetMember (+1 more)

### Community 77 - "Community 77"

Cohesion: 0.09
Nodes (5): KillmailsClient, WarsClient, Killmail, KillmailSummary, War

### Community 78 - "Community 78"

Cohesion: 0.21
Nodes (9): ACTIVE_PROJECT_ID, COMPLETED_PROJECT_ID, CONTRIBUTOR_CHARACTER_ID, CURSOR_TOKEN, PROJECT_CORPORATION_ID, projectFixtures, projectPaths, SECOND_CONTRIBUTOR_CHARACTER_ID (+1 more)

### Community 79 - "Community 79"

Cohesion: 0.15
Nodes (25): keepHeaders(), listFixtureFiles(), loadFixture(), parseFixture(), RecordedFixture, RecordedPage, Truncation, ARRAY_HEAD (+17 more)

### Community 80 - "Community 80"

Cohesion: 0.10
Nodes (24): Case, CASES, ENDPOINTS_DIR, fuzzClient(), RUNS, SEED, serve(), applyMutation() (+16 more)

### Community 81 - "Community 81"

Cohesion: 0.13
Nodes (23): ref_v8, ref_vm, arg(), analyseSoak(), DEFAULT_THRESHOLDS, formatBytes(), LinearFit, renderSoakMarkdown() (+15 more)

### Community 82 - "Community 82"

Cohesion: 0.12
Nodes (27): auditFile(), auditStepLayout(), checkFeatureBindings(), checkLegacyStepFiles(), checkStepFiles(), featureBindings(), Keyword, KEYWORDS (+19 more)

### Community 83 - "Community 83"

Cohesion: 0.23
Nodes (8): AMARR, AVOIDED_SYSTEM_IDS, DISTANT_SYSTEM_ID, JITA, routeFixtures, routePaths, routeRequest(), UNREACHABLE_SYSTEM_ID

### Community 84 - "Community 84"

Cohesion: 0.11
Nodes (21): CoverageInput, coverageProblems(), record(), FIXTURE_BUDGET_BYTES, FIXTURE_MAX_BYTES, KNOWN_MISMATCHES_PATH, REPO_ROOT, UNRECORDABLE_PATH (+13 more)

### Community 85 - "Community 85"

Cohesion: 0.09
Nodes (18): FactionClient, factionEndpoints, src_types_api_responses_factionwarfarecharacterleaderboard, src_types_api_responses_factionwarfarecharacterstats, src_types_api_responses_factionwarfarecorporationleaderboard, src_types_api_responses_factionwarfarecorporationstats, src_types_api_responses_factionwarfarefactionleaderboard, src_types_api_responses_factionwarfarestats (+10 more)

### Community 86 - "Community 86"

Cohesion: 0.18
Nodes (22): ContainerLogSchema, CorporationAllianceHistorySchema, CorporationDivisionsSchema, CorporationFacilitySchema, CorporationIconSchema, CorporationInfoSchema, CorporationIssuedMedalSchema, CorporationMedalSchema (+14 more)

### Community 87 - "Community 87"

Cohesion: 0.14
Nodes (26): AncestrySchema, AsteroidBeltSchema, BloodlineSchema, BlueprintSchema, ConstellationSchema, DogmaAttributeSchema, DogmaEffectSchema, EveCategorySchema (+18 more)

### Community 88 - "Community 88"

Cohesion: 0.16
Nodes (23): BaselineShardChoice, baselineShardFor(), MergeResult, mergeShardReports(), MutationMergeError, normalise(), parseShards(), ShardDefinition (+15 more)

### Community 89 - "Community 89"

Cohesion: 0.11
Nodes (22): advanceArb, cacheModelProperty(), CacheWrapper, canonicalOf(), FakeEsiState, Fault, Identity, ModelEntry (+14 more)

### Community 90 - "Community 90"

Cohesion: 0.08
Nodes (25): logLevel, apiReport, enabled, reportFileName, reportFolder, reportTempFolder, compiler, tsconfigFilePath (+17 more)

### Community 91 - "Community 91"

Cohesion: 0.08
Nodes (20): ref_lgriffin_esi_ts, ref_node_assert, players(), failures, loaded, pkg, require, subpaths (+12 more)

### Community 92 - "Community 92"

Cohesion: 0.15
Nodes (23): bootstrapRatioCi(), compareRuns(), Comparison, DEFAULT_OPTIONS, exactUCounts(), formatRatio(), holm(), mannWhitney() (+15 more)

### Community 93 - "Community 93"

Cohesion: 0.12
Nodes (21): ContractBidSchema, ContractItemSchema, ContractSchema, ContractTypeSchema, PublicContractBidSchema, PublicContractItemSchema, PublicContractSchema, src_schemas_index_characterfleetinfoschema (+13 more)

### Community 94 - "Community 94"

Cohesion: 0.15
Nodes (24): clip(), collectPublicDeclarations(), describeEdit(), generateMutants(), hasReturnType(), isLiteralTypeNode(), isNullish(), isPrivateMember() (+16 more)

### Community 95 - "Community 95"

Cohesion: 0.13
Nodes (24): buildSpecUrl(), detectTypeDrift(), EndpointEntry, ENDPOINTS_DIR, GENERATED_TYPES_FILE, main(), normalizePath(), normalizeTypeName() (+16 more)

### Community 96 - "Community 96"

Cohesion: 0.17
Nodes (23): PINNED, resolvedPlayers(), scenario(), startedBeforeFirstDelivery(), World, scenario(), scenario(), scenario() (+15 more)

### Community 97 - "Community 97"

Cohesion: 0.17
Nodes (4): main(), EsiTokenManager, toError(), SsoTokenResponse

### Community 98 - "Community 98"

Cohesion: 0.17
Nodes (23): ref_util, drainTransport(), captureLogger(), checkFault(), compare(), describeError(), describeRule(), describeSettled() (+15 more)

### Community 99 - "Community 99"

Cohesion: 0.21
Nodes (20): ref_zlib, isObject(), Json, Manifest, MIN_SPEC_MINOR, nameRootComponent(), npmPurl(), productionManifest() (+12 more)

### Community 100 - "Community 100"

Cohesion: 0.08
Nodes (17): src_types_api_responses_agentresearch, src_types_api_responses_blueprint, src_types_api_responses_characteraffiliation, src_types_api_responses_characterinfo, src_types_api_responses_characterportrait, src_types_api_responses_characterrole, src_types_api_responses_charactertitle, src_types_api_responses_corporationhistory (+9 more)

### Community 102 - "Community 102"

Cohesion: 0.12
Nodes (21): Counter, exhaustive, fetchText(), lostUpdate(), twoFetches(), ClockTracker, createPrng(), DEFAULT_HORIZON_MS (+13 more)

### Community 103 - "Community 103"

Cohesion: 0.11
Nodes (19): ASSERT_FUNCTION_NAMES, BDD_TEST_BLOCK_FUNCTIONS, config, FUNCTION_TYPES, isAssertionCall(), isAssertionName(), jestPlugin, nodeName() (+11 more)

### Community 104 - "Community 104"

Cohesion: 0.17
Nodes (12): fast-check, buildEndpointPath(), EndpointPathResult, EndpointDefinition, ALLOWED_ESI_HOSTS, validateBaseUrl(), validatePathParam(), validateQueryParam() (+4 more)

### Community 105 - "Community 105"

Cohesion: 0.16
Nodes (22): classify(), EntryPoint, entryPointsOf(), Mutant, MutantResult, TsdDiagnostic, typesTargetOf(), createWorkspace() (+14 more)

### Community 106 - "Community 106"

Cohesion: 0.09
Nodes (19): src_types_api_responses_containerlog, src_types_api_responses_corporationalliancehistory, src_types_api_responses_corporationdivisions, src_types_api_responses_corporationfacility, src_types_api_responses_corporationinfo, src_types_api_responses_corporationissuedmedal, src_types_api_responses_corporationmedal, src_types_api_responses_corporationmemberrole (+11 more)

### Community 107 - "Community 107"

Cohesion: 0.14
Nodes (18): KNOWN_AUTH_EXCEPTIONS, KNOWN_BODY_EXCEPTIONS, KNOWN_QUERY_PARAM_EXCEPTIONS, SNAPSHOT_PATH, EndpointEntry, ENDPOINTS_DIR, extractEndpointBlocks(), fetchSpec() (+10 more)

### Community 108 - "Community 108"

Cohesion: 0.12
Nodes (17): CLOCK_MODULES, CONSTRUCTS, FILES, GLOBAL_OBJECTS, message(), NODE_TIMER_MODULES, rules, TIMER_GLOBALS (+9 more)

### Community 109 - "Community 109"

Cohesion: 0.10
Nodes (14): key(), src_core_endpoints_esi_cache_ttls_generated, src_core_endpoints_esi_cache_ttls_generated_esicachettls, src_core_endpoints_esi_scopes_generated, src_core_endpoints_esi_scopes_generated_esiendpointscopes, src_core_endpoints_esi_scopes_generated_esiscope, EndpointEntry, ENDPOINTS_DIR (+6 more)

### Community 110 - "Community 110"

Cohesion: 0.13
Nodes (12): addUnknownFields(), attempts(), goodRequests(), INSTANT, isGet(), Json, mapJson(), negateNumbers() (+4 more)

### Community 111 - "Community 111"

Cohesion: 0.13
Nodes (17): attemptArb, backoffProperty(), baseArb, delayWith(), jitterArb, maxArb, RetryDelay, AnyProperty (+9 more)

### Community 112 - "Community 112"

Cohesion: 0.17
Nodes (21): import, require, exports, ./errors, ./package.json, ./schemas, ./sde, ./sde/memory (+13 more)

### Community 113 - "Community 113"

Cohesion: 0.17
Nodes (20): Advisory, advisoryId(), argValue(), AuditException, AuditReport, checkMode(), collectAdvisories(), describe() (+12 more)

### Community 114 - "Community 114"

Cohesion: 0.19
Nodes (20): CELL_FILES, checkEverySubpathIsImported(), CONSUMER_SOURCES, exportsProblems(), runRuntimeProbe(), runtimeProbeSource(), specifierFor(), exec() (+12 more)

### Community 115 - "Community 115"

Cohesion: 0.16
Nodes (18): ALL_ACTORS, BODIES, PATHS, PINNED, World, PINNED, World, Actor (+10 more)

### Community 116 - "Community 116"

Cohesion: 0.15
Nodes (4): WalletClient, CorporationWalletTransaction, WalletJournal, WalletTransaction

### Community 117 - "Community 117"

Cohesion: 0.10
Nodes (10): circuitClient(), DOGMA_ATTRIBUTE_IDS, feature, FIRST_PAYLOAD, NO_RETRIES, ONLINE_PAYLOAD, Outcome, RESOLVED_NAMES (+2 more)

### Community 118 - "Community 118"

Cohesion: 0.17
Nodes (18): finishTransport(), keyPaths(), mergedBody(), templatePattern(), NEGATIVE_FIXTURES_DIR, describeIssues(), escape(), exactUrl() (+10 more)

### Community 119 - "Community 119"

Cohesion: 0.15
Nodes (11): mentionedOnlyInText, unreferenced(), usedOnlyByAFixture, tests_tdd_export_coverage_fixtures_project_src_index_viastarreferenced, importedButUnused(), referenced(), ReferencedShape, viaStarReferenced() (+3 more)

### Community 120 - "Community 120"

Cohesion: 0.10
Nodes (19): compilerOptions, declaration, declarationMap, forceConsistentCasingInFileNames, module, moduleResolution, noFallthroughCasesInSwitch, noImplicitOverride (+11 more)

### Community 121 - "Community 121"

Cohesion: 0.15
Nodes (16): @cucumber/gherkin, @cucumber/messages, annotate(), collectFeatureFiles(), DEFAULT_PATHS, dynamicImport, FileResult, Finding (+8 more)

### Community 122 - "Community 122"

Cohesion: 0.21
Nodes (13): ref_node_module, asText(), parseSdeMetadata(), SdeMetadata, isMissing(), loadAdmZip(), loadJsYaml(), OptionalPeer (+5 more)

### Community 123 - "Community 123"

Cohesion: 0.23
Nodes (10): AuthError, CharacterNotFoundError, isAuthError(), isCharacterNotFound(), isSsoError(), isTokenRevoked(), SsoError, TokenDecodeError (+2 more)

### Community 124 - "Community 124"

Cohesion: 0.16
Nodes (16): skyhookEndpoints, OrbitalSkyhookSchema, RaidableSkyhookSchema, SkyhookDetailReagentSchema, SkyhookDetailReinforcementTimerSchema, SkyhookDetailSchema, SkyhookDetailTheftVulnerabilitySchema, SovereigntyHubDetailReagentBaySchema (+8 more)

### Community 125 - "Community 125"

Cohesion: 0.20
Nodes (7): INSURANCE_PRICES_MATCH, INSURANCE_PRICES_PATH, insuranceFixtures, LARGE_RESPONSE_BUDGET_MS, LARGE_SHIP_TYPE_COUNT, TIER_NAMES, SEAM_RETRY

### Community 126 - "Community 126"

Cohesion: 0.22
Nodes (12): ref_node_stream, SDE_BUILD_NUMBER_HEADER, SDE_DOWNLOAD_URL, SDE_FILE_REGISTRY, SDE_LATEST_BUILD_URL, SDE_METADATA_FILENAME, SdeFileSpec, BetterSqlite3Constructor (+4 more)

### Community 127 - "Community 127"

Cohesion: 0.29
Nodes (15): CANARY_CHECKS, CanaryCheck, canaryProblems(), CheckResult, isVerified(), ReleaseCanaryError, renderCanaryReport(), versionFrom() (+7 more)

### Community 128 - "Community 128"

Cohesion: 0.12
Nodes (4): MailClient, MailHeader, MailLabel, MailMessage

### Community 129 - "Community 129"

Cohesion: 0.29
Nodes (7): ACCESS_LIST_OWNER_ID, accessListFixtures, accessListPaths, EMPTY_ACCESS_LIST_ID, EXPIRED_ACCESS_TOKEN, MIXED_ACCESS_LIST_ID, UNKNOWN_ACCESS_LIST_ID

### Community 130 - "Community 130"

Cohesion: 0.20
Nodes (11): loginNewCharacter(), SCOPES, tokens, waitForCallback(), ref_crypto, ref_http, codeChallengeFromVerifier(), generateCodeVerifier() (+3 more)

### Community 131 - "Community 131"

Cohesion: 0.20
Nodes (16): CallbackResult, ENV_FILE, escapeHtml(), exchangeCode(), fetchAllScopes(), generateCodeChallenge(), generateCodeVerifier(), generateState() (+8 more)

### Community 132 - "Community 132"

Cohesion: 0.12
Nodes (6): src_types_api_responses_esiresponse, createStaleOnErrorClient(), DOGMA_ATTRIBUTE_IDS, FAST_RETRY, feature, SERVER_STATUS

### Community 133 - "Community 133"

Cohesion: 0.29
Nodes (3): CLONE_CHARACTER_ID, cloneFixtures, clonePaths

### Community 134 - "Community 134"

Cohesion: 0.29
Nodes (4): cosmeticsFixtures, cosmeticsPaths, CRIMSON_FURY_SKINR_ID, SKINR_CHARACTER_ID

### Community 135 - "Community 135"

Cohesion: 0.15
Nodes (16): HttpResponse, QueuedResponse, Scenario, SentRequest, CHARACTER_ID, CONTACTS_TTL_MS, contactsPayload(), AFTER (+8 more)

### Community 136 - "Community 136"

Cohesion: 0.27
Nodes (14): cmd(), DESCS, FAMILIES, familiesShown(), familyAsText(), keywordAsText(), loadScripts(), main() (+6 more)

### Community 137 - "Community 137"

Cohesion: 0.19
Nodes (15): camelToSnake(), EndpointEntry, ENDPOINTS_DIR, Exception, EXCEPTIONS_FILE, isGeneratedFile(), loadExceptions(), main() (+7 more)

### Community 138 - "Community 138"

Cohesion: 0.18
Nodes (10): buildMeta(), ClientMethods, createClient(), CursorResult, CursorTokens, EsiValidationError, parseHeaders(), parseWarning() (+2 more)

### Community 139 - "Community 139"

Cohesion: 0.16
Nodes (9): MetaClient, src_types_api_responses_metachangelog, src_types_api_responses_metacompatibilitydates, src_types_api_responses_metaname, src_types_api_responses_metastatus, MetaChangelog, MetaCompatibilityDates, MetaName (+1 more)

### Community 140 - "Community 140"

Cohesion: 0.25
Nodes (13): CharacterFreelanceJobsListingSchema, CorporationFreelanceJobsListingSchema, EsiCursorSchema, FreelanceJobDetailSchema, FreelanceJobParticipantSchema, FreelanceJobParticipantsListingSchema, FreelanceJobParticipationSchema, FreelanceJobsListingSchema (+5 more)

### Community 141 - "Community 141"

Cohesion: 0.16
Nodes (6): createNoopLogger(), noopLogger, pipelineClient(), InMemoryFetch, RecordedCall, StubbedResponse

### Community 142 - "Community 142"

Cohesion: 0.28
Nodes (9): isSdeDatabaseError(), isSdeError(), isSdeValidationError(), isSdeVersionMismatch(), SdeDatabaseError, SdeError, SdeValidationError, SdeVersionMismatchError (+1 more)

### Community 143 - "Community 143"

Cohesion: 0.23
Nodes (3): DatabaseLike, SdeDatabaseBuilder, StatementLike

### Community 144 - "Community 144"

Cohesion: 0.15
Nodes (15): argsArb, canonical(), dedupeIdentityProperty, DEFINITION, fragmentValue, identityProperty, identityPropertyOver(), KeyFn (+7 more)

### Community 145 - "Community 145"

Cohesion: 0.13
Nodes (15): js-yaml, js-yaml, js-yaml, overrides, brace-expansion, cosmiconfig, esbuild, @faker-js/faker (+7 more)

### Community 146 - "Community 146"

Cohesion: 0.21
Nodes (14): applyRatchet(), cell(), renderScoreTable(), renderSurvivors(), scoreByEntryPoint(), Thresholds, flag(), intFlag() (+6 more)

### Community 147 - "Community 147"

Cohesion: 0.21
Nodes (12): cosmeticsEndpoints, CharacterSkinrComponentsSchema, CharacterSkinrSchema, SkinrComponentLicenseSchema, SkinrComponentRunsSchema, SkinrLayoutSchema, SkinrLayoutSlotSchema, SkinrLicenseSchema (+4 more)

### Community 148 - "Community 148"

Cohesion: 0.26
Nodes (5): findEntry(), openZip(), readEntryAsString(), SdeExtractor, toVersionInfo()

### Community 149 - "Community 149"

Cohesion: 0.17
Nodes (13): library, plans, capitalise(), describePattern(), featureForSpec(), formatDefinition(), planFeature(), PlannedStep (+5 more)

### Community 151 - "Community 151"

Cohesion: 0.22
Nodes (4): AssetsClient, AssetLocation, AssetName, CharacterAsset

### Community 152 - "Community 152"

Cohesion: 0.18
Nodes (7): DogmaClient, src_types_api_responses_dogmaattribute, src_types_api_responses_dogmadynamicitem, src_types_api_responses_dogmaeffect, DogmaAttribute, DogmaDynamicItem, DogmaEffect

### Community 153 - "Community 153"

Cohesion: 0.22
Nodes (11): paragonHubEndpoints, ParagonHubCharacterListingSchema, ParagonHubCharacterSkinrResponseSchema, ParagonHubCursorSchema, ParagonHubSkinrListingSchema, ParagonHubSkinrPriceSchema, ParagonHubSkinrResponseSchema, ParagonHubSkinrTargetSchema (+3 more)

### Community 154 - "Community 154"

Cohesion: 0.14
Nodes (13): src_index_allianceid, src_index_brand, src_index_characterid, src_index_corporationid, src_index_orderid, src_index_regionid, src_index_systemid, src_index_typeid (+5 more)

### Community 155 - "Community 155"

Cohesion: 0.14
Nodes (13): Brand, ContractId, CorporationAllianceId, CorporationId, FactionId, FleetId, KillmailId, OrderId (+5 more)

### Community 156 - "Community 156"

Cohesion: 0.29
Nodes (3): setRequestGate(), Run, trackTimers()

### Community 157 - "Community 157"

Cohesion: 0.19
Nodes (3): ApiClientLike, Cache, Clock

### Community 158 - "Community 158"

Cohesion: 0.21
Nodes (8): feature, sellOrder(), feature, feature, feature, ref_src_core_util_error, ref_src_esiclient, ref_support

### Community 159 - "Community 159"

Cohesion: 0.27
Nodes (10): mitata, arg(), main(), HarnessResult, percentile(), summarise(), T_95, TaskSummary (+2 more)

### Community 160 - "Community 160"

Cohesion: 0.23
Nodes (12): extractEndpoints(), generateScaffoldFile(), main(), OpenApiOperation, OpenApiParameter, OpenApiSchema, OpenApiSpec, OUTPUT_FILE (+4 more)

### Community 161 - "Community 161"

Cohesion: 0.21
Nodes (4): CalendarClient, CalendarEvent, CalendarEventAttendee, CalendarEventDetail

### Community 162 - "Community 162"

Cohesion: 0.37
Nodes (9): FactionWarfareCharacterLeaderboardSchema, FactionWarfareCharacterStatsSchema, FactionWarfareCorporationLeaderboardSchema, FactionWarfareCorporationStatsSchema, FactionWarfareFactionLeaderboardSchema, FactionWarfareLeaderboardSchema, FactionWarfareStatsSchema, FactionWarfareSystemSchema (+1 more)

### Community 163 - "Community 163"

Cohesion: 0.26
Nodes (10): mercenaryEndpoints, MercenaryDenDetailEvolutionLevelSchema, MercenaryDenDetailEvolutionSchema, MercenaryDenDetailInfomorphsSchema, MercenaryDenDetailReinforcementTimerSchema, MercenaryDenDetailSchema, MercenaryDenDetailSkyhookSchema, MercenaryDenSchema (+2 more)

### Community 164 - "Community 164"

Cohesion: 0.37
Nodes (3): metaFixtures, metaPaths, YAML_CONTENT_TYPE

### Community 165 - "Community 165"

Cohesion: 0.17
Nodes (6): dotenv/config, EsiClient, EveType, SdeDataProvider, SolarSystem, winston

### Community 166 - "Community 166"

Cohesion: 0.26
Nodes (11): esbuild, arg(), BUNDLE, EXTERNAL, HARNESS_DIR, HARNESS_ENTRY, main(), prepareBase() (+3 more)

### Community 167 - "Community 167"

Cohesion: 0.27
Nodes (10): emitEsmDeclarations(), esmTypeEntries(), fs, isFile(), isRelative(), moduleSpecifierNodes(), path, resolveRelative() (+2 more)

### Community 168 - "Community 168"

Cohesion: 0.23
Nodes (4): PiClient, ColonyLayout, CustomsOffice, PlanetaryColony

### Community 169 - "Community 169"

Cohesion: 0.20
Nodes (4): CharacterSkillsClient, CharacterAttributes, CharacterSkill, SkillQueue

### Community 170 - "Community 170"

Cohesion: 0.41
Nodes (9): CorporationIndustryJobSchema, IndustryFacilitySchema, IndustryJobSchema, IndustryJobStatusSchema, IndustrySystemSchema, MiningLedgerEntrySchema, MiningObserverEntrySchema, MiningObserverSchema (+1 more)

### Community 171 - "Community 171"

Cohesion: 0.17
Nodes (11): compilerOptions, module, moduleResolution, outDir, resolveJsonModule, rootDir, skipLibCheck, strict (+3 more)

### Community 172 - "Community 172"

Cohesion: 0.20
Nodes (9): typescript, applyMutant(), EntryPointScore, hash32(), MutationOperator, sampleMutants(), FIXTURE, mutate() (+1 more)

### Community 173 - "Community 173"

Cohesion: 0.24
Nodes (7): LocationClient, src_types_api_responses_characterlocation, src_types_api_responses_characteronline, src_types_api_responses_charactership, CharacterLocation, CharacterOnline, CharacterShip

### Community 174 - "Community 174"

Cohesion: 0.36
Nodes (8): MetaChangelogEntrySchema, MetaChangelogSchema, MetaCompatibilityDatesSchema, MetaNameSchema, MetaRouteStatusSchema, MetaStatusSchema, MetaChangelogEntry, MetaRouteStatus

### Community 176 - "Community 176"

Cohesion: 0.20
Nodes (9): eslint, entry, exclude, ignore, ignoreDependencies, ignoreExportsUsedInFile, ignoreMembers, project (+1 more)

### Community 177 - "Community 177"

Cohesion: 0.20
Nodes (8): tsd, ref_types, InferEndpointResult, ArrayEndpoint, CursorEndpoint, CursorNoSchemaEndpoint, NoSchemaEndpoint, ObjectEndpoint

### Community 178 - "Community 178"

Cohesion: 0.27
Nodes (8): CONDITIONS, externalsOf(), NOT_CODE, sizeLimitChecks(), targetFor(), budgets, manifest, { sizeLimitChecks }

### Community 179 - "Community 179"

Cohesion: 0.29
Nodes (3): LoyaltyClient, LoyaltyPoints, LoyaltyStoreOffer

### Community 180 - "Community 180"

Cohesion: 0.31
Nodes (6): COMPATIBILITY_DATE, PACKAGE_NAME, PACKAGE_VERSION, USER_AGENT, GENERATED, ROOT

### Community 181 - "Community 181"

Cohesion: 0.56
Nodes (8): extractLocale(), isLocaleMap(), normalizeNested(), normalizeSdeFieldName(), SqliteValue, toSqliteValue(), transformRecord(), transformRecordNative()

### Community 182 - "Community 182"

Cohesion: 0.25
Nodes (4): eslint, typescript-eslint, eslint, seamRules

### Community 183 - "Community 183"

Cohesion: 0.50
Nodes (7): exampleConstructorConfig(), exampleRefreshFailure(), exampleRuntimeConfig(), exampleWithoutProvider(), handleError(), main(), refreshAccessToken()

### Community 184 - "Community 184"

Cohesion: 0.22
Nodes (8): ./tsconfig.json, compilerOptions, declaration, declarationMap, noUncheckedIndexedAccess, rootDir, extends, include

### Community 185 - "Community 185"

Cohesion: 0.36
Nodes (8): checkDrift(), DriftReport, ENDPOINTS_DIR, main(), normalizePath(), parseCompatibilityDate(), parseEndpointFiles(), resolveCompatibilityDate()

### Community 186 - "Community 186"

Cohesion: 0.31
Nodes (3): ParagonHubClient, ParagonHubCharacterSkinrResponse, ParagonHubSkinrResponse

### Community 187 - "Community 187"

Cohesion: 0.28
Nodes (5): ConcurrencyOptions, DEFAULT_CONCURRENCY, resolveLimit(), runWithConcurrency(), SettledResult

### Community 188 - "Community 188"

Cohesion: 0.33
Nodes (3): mockHandleRequest, TestClient, testEndpoints

### Community 189 - "Community 189"

Cohesion: 0.36
Nodes (6): ref_node_url, CHARACTER, installStubFetch(), requests, ROUTES, unrouted

### Community 191 - "Community 191"

Cohesion: 0.29
Nodes (7): FeatureOutline, OutlinedRule, OutlinedScenario, outlineFeature(), ParsedFeature, ParsedStep, ruleLines()

### Community 192 - "Community 192"

Cohesion: 0.25
Nodes (7): ETAG_FOR_PLAYERS, metaOf(), PINNED, WithMeta, World, Outcome, STATUS_TTL_MS

### Community 193 - "Community 193"

Cohesion: 0.29
Nodes (7): optional, optional, optional, peerDependenciesMeta, adm-zip, better-sqlite3, js-yaml

### Community 194 - "Community 194"

Cohesion: 0.43
Nodes (6): announce(), deadlineMs(), main(), ROOT, classifyPrMutationRun(), PR_EXIT

### Community 196 - "Community 196"

Cohesion: 0.48
Nodes (4): skillEndpoints, CharacterSkillSchema, CharacterSkillsResponseSchema, SkillQueueSchema

### Community 204 - "Community 204"

Cohesion: 0.29
Nodes (3): EsiClient, EsiClientConfig, ServerStatus

### Community 205 - "Community 205"

Cohesion: 0.29
Nodes (6): exports, ./extra, ./package.json, types, name, private

### Community 206 - "Community 206"

Cohesion: 0.29
Nodes (6): MOCK_CAMPAIGN, MOCK_CAMPAIGNS, MOCK_CHARACTER_OBJECTIVE, MOCK_CHARACTER_OBJECTIVES, MOCK_OBJECTIVE, MOCK_OBJECTIVES

### Community 207 - "Community 207"

Cohesion: 0.53
Nodes (5): arg(), CompareOptions, renderMarkdown(), load(), main()

### Community 208 - "Community 208"

Cohesion: 0.33
Nodes (5): exports, files, name, private, types

### Community 211 - "Community 211"

Cohesion: 0.40
Nodes (4): include-component-in-tag, last-release-sha, packages, $schema

### Community 213 - "Community 213"

Cohesion: 0.40
Nodes (4): description, name, private, version

### Community 214 - "Community 214"

Cohesion: 0.40
Nodes (4): Builder, builderSchemas, NOT_PAYLOAD_BUILDERS, payloadBuilders

### Community 215 - "Community 215"

Cohesion: 0.50
Nodes (4): lint-staged, _.{json,md,yml,yaml}, src/\**/_.ts, tests/**/*.ts

### Community 216 - "Community 216"

Cohesion: 0.50
Nodes (4): peerDependencies, adm-zip, better-sqlite3, js-yaml

### Community 221 - "Community 221"

Cohesion: 0.50
Nodes (3): compilerOptions, strict, types

### Community 225 - "Community 225"

Cohesion: 0.67
Nodes (3): dependencies, pino, zod

### Community 226 - "Community 226"

Cohesion: 0.67
Nodes (3): repository, type, url

## Knowledge Gaps

- **1411 isolated node(s):** `RequestGate`, `TransportFault`, `EsiDatasource`, `ErrorLimitState`, `GroupBucket` (+1406 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 2265 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **70 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `jest-cucumber` connect `Community 1` to `Community 132`, `Community 10`, `Community 11`, `Community 142`, `Community 48`, `Community 117`, `Community 220`, `Community 29`, `Community 158`, `Community 191`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Why does `zod` connect `Community 21` to `Community 4`, `Community 6`, `Community 9`, `Community 138`, `Community 10`, `Community 140`, `Community 13`, `Community 147`, `Community 20`, `Community 153`, `Community 25`, `Community 29`, `Community 162`, `Community 163`, `Community 34`, `Community 38`, `Community 41`, `Community 170`, `Community 174`, `Community 46`, `Community 177`, `Community 56`, `Community 196`, `Community 73`, `Community 80`, `Community 86`, `Community 214`, `Community 93`, `Community 124`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Why does `EsiClient` connect `Community 3` to `Community 128`, `Community 1`, `Community 132`, `Community 5`, `Community 6`, `Community 135`, `Community 8`, `Community 10`, `Community 139`, `Community 14`, `Community 15`, `Community 18`, `Community 152`, `Community 24`, `Community 26`, `Community 161`, `Community 35`, `Community 38`, `Community 40`, `Community 168`, `Community 169`, `Community 41`, `Community 45`, `Community 48`, `Community 51`, `Community 179`, `Community 183`, `Community 186`, `Community 64`, `Community 65`, `Community 192`, `Community 69`, `Community 76`, `Community 77`, `Community 81`, `Community 85`, `Community 96`, `Community 97`, `Community 98`, `Community 229`, `Community 104`, `Community 115`, `Community 117`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **What connects `RequestGate`, `TransportFault`, `EsiDatasource` to the rest of the system?**
  _1411 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.010526315789473684 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.03057250799186283 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.030799000241876966 - nodes in this community are weakly interconnected._
