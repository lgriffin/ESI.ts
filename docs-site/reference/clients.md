# Domain Clients

All 35 domain clients are accessed as properties on the `EsiClient` instance. Each extends `BaseEsiClient` and provides typed methods for its ESI domain.

## Client List

| Client             | Property                     | Auth | Key Methods                                                                                                               |
| ------------------ | ---------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------- |
| Alliance           | `client.alliance`            | Some | `getAlliances()`, `getAllianceById(id)`, `getAllianceCorporations(id)`, `getAllianceIcons(id)`, `getAllianceContacts(id)` |
| Assets             | `client.assets`              | Yes  | `getCharacterAssets(id)`, `getCorporationAssets(id)`, `postCharacterAssetLocations(id, ids)`                              |
| Calendar           | `client.calendar`            | Yes  | `getCalendarEvents(id)`, `getCalendarEvent(id, eventId)`, `respondToEvent(id, eventId, response)`                         |
| Characters         | `client.characters`          | Some | `getCharacterPublicInfo(id)`, `getCharacterPortrait(id)`, `getCharacterAffiliations(ids)`, `getCharacterRoles(id)`        |
| Clones             | `client.clones`              | Yes  | `getCharacterClones(id)`, `getCharacterImplants(id)`                                                                      |
| Contacts           | `client.contacts`            | Yes  | `getCharacterContacts(id)`, `postCharacterContacts(id, standing, ids)`, `deleteCharacterContacts(id, ids)`                |
| Contracts          | `client.contracts`           | Yes  | `getCharacterContracts(id)`, `getPublicContracts(regionId)`, `getContractItems(id, contractId)`                           |
| Corp Projects      | `client.corporationProjects` | Yes  | `getCorporationProjects(corpId)`, `getCorporationProject(corpId, projectId)`                                              |
| Corporations       | `client.corporations`        | Some | `getCorporationInfo(id)`, `getCorporationMembers(id)`, `getCorporationStructures(id)`                                     |
| Cosmetics          | `client.cosmetics`           | Some | `getSkinr(id)`, `getCharacterSkinr(charId)`, `getCharacterSkinrComponents(charId)`                                        |
| Dogma              | `client.dogma`               | No   | `getDogmaAttributes()`, `getDogmaAttribute(id)`, `getDogmaEffects()`, `getDynamicItemInfo(typeId, itemId)`                |
| Factions           | `client.factions`            | Some | `getFactionWarStats()`, `getFactionWarSystems()`, `getCharacterFactionWarStats(id)`                                       |
| Fittings           | `client.fittings`            | Yes  | `getFittings(id)`, `createFitting(id, body)`, `deleteFitting(id, fittingId)`                                              |
| Fleets             | `client.fleets`              | Yes  | `getFleetInformation(id)`, `getFleetMembers(id)`, `getFleetWings(id)`                                                     |
| Freelance Jobs     | `client.freelanceJobs`       | Some | `getFreelanceJobs()`, `getFreelanceJobById(id)`, `getCharacterFreelanceJobs(id)`                                          |
| Incursions         | `client.incursions`          | No   | `getIncursions()`                                                                                                         |
| Industry           | `client.industry`            | Some | `getCharacterIndustryJobs(id)`, `getIndustrySystems()`, `getIndustryFacilities()`                                         |
| Insurance          | `client.insurance`           | No   | `getInsurancePrices()`                                                                                                    |
| Killmails          | `client.killmails`           | Some | `getKillmail(id, hash)`, `getCharacterRecentKillmails(id)`                                                                |
| Location           | `client.location`            | Yes  | `getCharacterLocation(id)`, `getCharacterShip(id)`, `getCharacterOnline(id)`                                              |
| Loyalty            | `client.loyalty`             | Yes  | `getCharacterLoyaltyPoints(id)`, `getCorporationLoyaltyStoreOffers(corpId)`                                               |
| Mail               | `client.mail`                | Yes  | `getCharacterMail(id)`, `sendMail(id, body)`, `deleteMail(id, mailId)`                                                    |
| Market             | `client.market`              | Some | `getMarketPrices()`, `getMarketOrders(regionId)`, `getMarketHistory(regionId, typeId)`                                    |
| Mercenary          | `client.mercenary`           | Yes  | `getMercenaryDens(charId)`, `getMercenaryDenDetail(charId, denId)`                                                        |
| Meta               | `client.meta`                | No   | `getOpenApiJson()`, `getOpenApiYaml()`                                                                                    |
| Military Campaigns | `client.militaryCampaigns`   | Some | `getMilitaryCampaigns()`, `getMilitaryCampaignById(id)`                                                                   |
| Paragon Hub        | `client.paragonHub`          | Some | `getPublicListings()`, `getCharacterListings(charId)`, `getAllianceListings(id)`                                          |
| PI                 | `client.pi`                  | Yes  | `getCharacterPlanets(id)`, `getCharacterPlanet(id, planetId)`                                                             |
| Route              | `client.route`               | No   | `getRoute(origin, dest)`                                                                                                  |
| Search             | `client.search`              | Some | `search(charId, query)`                                                                                                   |
| Skills             | `client.skills`              | Yes  | `getCharacterSkills(id)`, `getCharacterSkillQueue(id)`                                                                    |
| Skyhooks           | `client.skyhooks`            | Some | `getRaidableSkyhooks()`, `getSovereigntyHubs(corpId)`, `getSkyhookDetail(corpId, id)`                                     |
| Sovereignty        | `client.sovereignty`         | No   | `getSovereigntySystems()`, `getSovereigntyMap()`, `getSovereigntyCampaigns()`                                             |
| Status             | `client.status`              | No   | `getStatus()`                                                                                                             |
| UI                 | `client.ui`                  | Yes  | `setAutopilotWaypoint(destId, addToBeginning, clear)`, `openMarketDetails(typeId)`, `openNewMailWindow(body)`             |
| Universe           | `client.universe`            | Some | `getSystemById(id)`, `getTypeById(id)`, `getRegionById(id)`, `postUniverseNames(ids)`                                     |
| Wallet             | `client.wallet`              | Yes  | `getCharacterWallet(id)`, `getCharacterWalletJournal(id)`, `getCharacterWalletTransactions(id)`                           |
| Wars               | `client.wars`                | No   | `getWars()`, `getWarById(id)`, `getWarKillmails(warId)`                                                                   |

## Auth Legend

| Value    | Meaning                                  |
| -------- | ---------------------------------------- |
| **No**   | All methods are public — no token needed |
| **Yes**  | All methods require an access token      |
| **Some** | Mix of public and authenticated methods  |

## Common Methods on All Clients

Every domain client inherits these from `BaseEsiClient`:

### withMetadata()

Returns a variant where every method returns `{ data, meta }` instead of just the data:

```typescript
const result = await client.alliance.withMetadata().getAllianceById(99000001);
console.log(result.data.name, result.meta.responseTimeMs);
```

### withSafeMode()

Returns a variant where errors are returned as values instead of thrown:

```typescript
const result = await client.alliance.withSafeMode().getAllianceById(99999999);
if (!result.ok) console.log(result.error.statusCode);
```

### streamEndpoint()

Generic streaming pagination for any endpoint in the client's endpoint map:

```typescript
for await (const page of client.market.streamEndpoint(
  'getMarketOrders',
  regionId,
)) {
  console.log(page.data.length, 'items on page', page.page);
}
```
