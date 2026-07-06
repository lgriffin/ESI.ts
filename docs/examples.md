# ESI.ts Examples Guide

This guide documents all 40 examples included with ESI.ts, complete with real console output captured from live runs against the EVE Online ESI API. The examples are organized into three categories: **Public** (no authentication required), **Hybrid** (partially public, partially authenticated), and **Authenticated** (require an ESI access token with specific scopes).

> **Note:** Values such as player counts, ISK prices, market volumes, sovereignty campaigns, and dates reflect a point-in-time snapshot and will vary on each run.

---

## Table of Contents

### Public Examples

1. [Server Status](#server-status)
2. [Alliance Info](#alliance-info)
3. [Character Lookup](#character-lookup)
4. [Universe Info](#universe-info)
5. [Market Prices](#market-prices)
6. [Route Planner](#route-planner)
7. [Wars](#wars)
8. [Sovereignty](#sovereignty)
9. [Incursions](#incursions)
10. [Industry](#industry)
11. [Dogma](#dogma)
12. [Rate Limiting](#rate-limiting)
13. [Retry, Timeout and Metadata](#retry-timeout-and-metadata)
14. [Mercenary](#mercenary)
15. [Skyhooks](#skyhooks)
16. [Streaming Pagination](#streaming-pagination)
17. [Universe Encyclopedia](#universe-encyclopedia)
18. [Dogma, Meta & Sovereignty](#dogma-meta--sovereignty)

### Hybrid Examples

19. [Character Profile](#character-profile)
20. [Contracts Browser](#contracts-browser)
21. [Cursor Pagination](#cursor-pagination)
22. [Faction Warfare Details](#faction-warfare-details)

### Authenticated Examples

23. [Wallet Overview](#wallet-overview)
24. [Skills Overview](#skills-overview)
25. [Assets Inventory](#assets-inventory)
26. [Killmails](#killmails)
27. [Fleet Operations](#fleet-operations)
28. [Mail Inbox](#mail-inbox)
29. [Location Tracker](#location-tracker)
30. [Fittings and Clones](#fittings-and-clones)
31. [Contacts](#contacts)
32. [Access Lists](#access-lists)
33. [Token Refresh](#token-refresh)
34. [Character Details](#character-details)
35. [Calendar & Search](#calendar--search)
36. [Loyalty & Planetary Interaction](#loyalty--planetary-interaction)
37. [Industry & Mining](#industry--mining)
38. [Market Orders & Groups](#market-orders--groups)
39. [Corporation Details](#corporation-details)
40. [Corp Contracts & Wallet](#corp-contracts--wallet)

---

## Prerequisites

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Build the project:**

   ```bash
   npm run build
   ```

3. **Authentication (for authenticated examples):**

   Create a `.env` file in the project root with your EVE SSO credentials:

   ```env
   ESI_ACCESS_TOKEN=your_access_token_here
   ESI_REFRESH_TOKEN=your_refresh_token_here
   ESI_CLIENT_ID=your_client_id_here
   ```

   Public examples work without any environment variables. Hybrid examples will run their public portions without tokens and skip authenticated sections. Authenticated examples require a valid `ESI_ACCESS_TOKEN` with the scopes listed for each example.

---

## Public Examples

These examples use only public ESI endpoints and require no authentication.

---

### Server Status

> Quick check that the ESI API is reachable and the EVE server is online.

**Run:** `npm run example:status`

```
EVE Server Status
----------------------------------------
  Players online: 26,360
  Server version: 3409592
  Start time:     2026-06-30T11:01:57Z

ESI is reachable and working.
```

---

### Alliance Info

> Looks up an alliance, its member corporations, and icons.

**Run:** `npm run example:alliance`

```
Alliance Lookup

Alliance Info
----------------------------------------
  Name:          Goonswarm Federation [CONDI]
  Founded:       1/6/2010
  Creator Corp:  459299583
  Executor Corp: 1344654522
  Member Corps:  780

Icons
----------------------------------------
  64x64:  https://images.evetech.net/alliances/1354830081/logo?tenant=tranquility&size=64
  128x128: https://images.evetech.net/alliances/1354830081/logo?tenant=tranquility&size=128

Sample Member Corporations
----------------------------------------
  Isk Redistribution Services [EYERS] - 8 members
  Thunderwaffe [-REP] - 537 members
  Angry Angels Constructions [.AAC.] - 629 members
```

---

### Character Lookup

> Looks up a character's public info, portrait, and corporation.

**Run:** `npm run example:character`

```
Looking up character 1689391488...

Character Info
----------------------------------------
  Name:            deiseman
  Birthday:        2/3/2008
  Security Status: 0.44
  Corporation ID:  1000170

Portrait URLs
----------------------------------------
  64x64:   https://images.evetech.net/characters/1689391488/portrait?tenant=tranquility&size=64
  128x128: https://images.evetech.net/characters/1689391488/portrait?tenant=tranquility&size=128
  256x256: https://images.evetech.net/characters/1689391488/portrait?tenant=tranquility&size=256
  512x512: https://images.evetech.net/characters/1689391488/portrait?tenant=tranquility&size=512

Corporation
----------------------------------------
  Name:    Republic Military School [RMS]
  Members: 1,619,020
```

---

### Universe Info

> Fetches solar system, station, and constellation details.

**Run:** `npm run example:universe`

```
Universe Data Lookup

Solar System: Jita
----------------------------------------
  System ID:        30000142
  Name:             Jita
  Security Status:  0.9459
  Constellation ID: 20000020
  Planets:          8
  Stargates:        7
  Stations:         18

Constellation: Kimotoro
----------------------------------------
  Constellation ID: 20000020
  Region ID:        10000002
  Systems:          7

Region: The Forge
----------------------------------------
  Region ID:        10000002
  Constellations:   13

Station: Jita IV - Moon 4 - Caldari Navy Assembly Plant
----------------------------------------
  Station ID:       60003760
  Owner (Corp ID):  1000035
  Type ID:          52678
```

---

### Market Prices

> Fetches average market prices and price history for a specific item.

**Run:** `npm run example:market`

```
Market Data

Average Prices (Universe-wide)
--------------------------------------------------
  Tritanium              avg:               3.77  adj:               2.85
  PLEX                   avg:       4,552,093.83  adj:                  0
  Raven (Battleship)     avg:          21,728.53  adj:          21,354.88
  Rifter (Frigate)       avg:         348,838.87  adj:         408,464.67

Tritanium Price History (The Forge, last 5 days)
----------------------------------------------------------------------
  Date          Average       Lowest       Highest      Volume
  2026-06-25         3.60         3.57         3.67  7,632,038,238
  2026-06-26         3.52         3.42         3.62  5,500,792,004
  2026-06-27         3.59         3.57         3.61  6,549,539,936
  2026-06-28         3.63         3.62         3.64  8,173,661,795
  2026-06-29         3.56         3.55         3.57  7,126,944,418

Total items with price data: 16071
```

---

### Route Planner

> Calculates the shortest route between two solar systems and looks up the name of each system along the way.

**Run:** `npm run example:route`

```
Route: Jita -> Amarr

Total jumps: 11

Route (Shortest)
----------------------------------------
  START  Jita (0.95)
      1  Ikuchi (0.95)
      2  Ansila (0.91)
      3  Hykkota (0.82)
      4  Ahbazon (0.42)
      5  Shera (0.60)
      6  Gensela (0.69)
      7  Zororzih (0.74)
      8  Akhragan (0.80)
      9  Kehour (0.92)
     10  Ashab (0.91)
  END    Amarr (0.95)

Route (Safer)
----------------------------------------
  45 jumps
```

---

### Wars

> Fetches recent wars and shows details for the most recent one.

**Run:** `npm run example:wars`

```
Recent Wars

Total war IDs returned: 2000

--------------------------------------------------
  War ID:      761008
  Declared:    2026-06-05T18:53:00Z
  Started:     2026-06-05T18:53:00Z
  Finished:    Ongoing
  Mutual:      No
  Aggressor:   Alliance 99002974
  Defender:    Corp 98812464
  Ships killed: 0 (aggressor) / 0 (defender)

--------------------------------------------------
  War ID:      761007
  Declared:    2026-06-10T16:42:00Z
  Started:     2026-06-11T16:42:00Z
  Finished:    Ongoing
  Mutual:      No
  Aggressor:   Alliance 99014873
  Defender:    Corp 98812464
  Ships killed: 0 (aggressor) / 0 (defender)

--------------------------------------------------
  War ID:      761006
  Declared:    2026-06-30T07:33:00Z
  Started:     2026-07-01T07:33:00Z
  Finished:    Ongoing
  Mutual:      No
  Aggressor:   Corp 98811415
  Defender:    Alliance 99014622
  Ships killed: 0 (aggressor) / 0 (defender)
```

---

### Sovereignty

> Shows active sovereignty campaigns -- contested structures, attack/defense scores, and event types.

**Run:** `npm run example:sovereignty`

```
Sovereignty Campaigns

Active campaigns: 17

Campaigns by Type
--------------------------------------------------
  ihub_defense: 17

Recent Campaigns (first 5)
------------------------------------------------------------
  System 30004738 | ihub_defense | Attack: 40.0% | Defense: 60.0% | Defender: 99012786
  System 30005158 | ihub_defense | Attack: 40.0% | Defense: 60.0% | Defender: 99007887
  System 30005109 | ihub_defense | Attack: 40.0% | Defense: 60.0% | Defender: 99007887
  System 30005115 | ihub_defense | Attack: 40.0% | Defense: 60.0% | Defender: 99007887
  System 30002844 | ihub_defense | Attack: 40.0% | Defense: 60.0% | Defender: 99013045
```

---

### Incursions

> Shows active Sansha incursions and faction warfare statistics.

**Run:** `npm run example:incursions`

```
Incursions & Faction Warfare

Active Incursions
--------------------------------------------------
  Constellation 20000403: established (influence: 1.00)
    Staging system: 30002751, Boss: Yes
    Infested systems: 6
  Constellation 20000263: mobilizing (influence: 0.00)
    Staging system: 30001781, Boss: No
    Infested systems: 9
  Constellation 20000156: established (influence: 0.00)
    Staging system: 30001068, Boss: No
    Infested systems: 6
  Constellation 20000771: established (influence: 1.00)
    Staging system: 30005272, Boss: No
    Infested systems: 6
  Constellation 20000675: established (influence: 0.08)
    Staging system: 30004628, Boss: No
    Infested systems: 6

Faction Warfare Statistics
--------------------------------------------------
  Faction 500001:
    Pilots: 56938  Systems controlled: 46
    Kills (yesterday): 513
  Faction 500002:
    Pilots: 34257  Systems controlled: 26
    Kills (yesterday): 338
  Faction 500003:
    Pilots: 32393  Systems controlled: 44
    Kills (yesterday): 354
  Faction 500004:
    Pilots: 44720  Systems controlled: 44
    Kills (yesterday): 540

Contested Systems: 160
  Actively contested: 88
```

---

### Industry

> Fetches public industry data: facility locations, system cost indices, and insurance prices for ships.

**Run:** `npm run example:industry`

```
Industry & Insurance Data

Industry Facilities
----------------------------------------
  Total facilities: 2321
  Facility 60006400 in system 30003488 (owner: 1000065, type: 1928)
  Facility 60014593 in system 30004099 (owner: 1000164, type: 3865)
  Facility 60006403 in system 30003490 (owner: 1000065, type: 1928)

Industry System Cost Indices (top 5 by manufacturing)
------------------------------------------------------------
  System 30000142: 18.7400%
  System 30002537: 12.6600%
  System 30002647: 11.7800%
  System 30001363: 11.4000%
  System 30002780: 10.3400%

Insurance Prices (sample ships)
--------------------------------------------------
  Type 587: Platinum cost 56,535.9 ISK -> payout 188,453 ISK
  Type 24690: Platinum cost 34,367,188.8 ISK -> payout 114,557,296 ISK
  Type 17703: Platinum cost 76,108.5 ISK -> payout 253,695 ISK
```

---

### Dogma

> Explores EVE's game mechanics data: item types, dogma attributes, and effects.

**Run:** `npm run example:dogma`

```
Dogma & Item Type Data

Item: Rifter
----------------------------------------
  Type ID:     587
  Group ID:    25
  Description: The Rifter is a very powerful combat frigate and can easily tackle the best frig...
  Mass:        1,067,000 kg
  Volume:      27,289 m3
  Capacity:    140 m3
  Published:   true

Dogma Attributes on Rifter (first 5 of 95)
----------------------------------------
  Item Damage: 0
  Mass: 1067000
  Structure Hitpoints: 350
  Rig Size: 1
  Low Slots: 4

Total dogma attributes in game: 2855
```

---

### Rate Limiting

> Demonstrates rate-limiting awareness, pagination with large datasets, and error handling for non-existent resources.

**Run:** `npm run example:rate-limiting`

```
Rate Limiting & Pagination Demo

1. Testing rate limiting awareness...
   Made 5 parallel requests in 79ms
   Each returned 114 regions

2. Testing pagination with universe types...
   Fetched 52630 types in 6451ms
   Average time per item: 0.12ms

3. Testing error handling...
   Correctly handled non-existent schematic error

Rate limiting and pagination demo completed!
```

---

### Retry, Timeout and Metadata

> Demonstrates retry with exponential backoff, request timeouts, TimeoutError handling, and rich response metadata via withMetadata().

**Run:** `npm run example:retry-timeout-metadata`

```
Retry, Timeout & Response Metadata Demo

Example 1: Retry with exponential backoff
==================================================
  Server online: 26,450 players
  (Retries would fire automatically on transient errors)

Example 2: Backward-compatible retryAttempts
==================================================
  Fetched 3608 alliances
  (retryAttempts: 2 -> retryConfig.maxRetries: 2)

Example 3: Typed TimeoutError
==================================================
  Caught TimeoutError after 1ms
  instanceof EsiError: true
  statusCode: 0
  retryable: true

Example 4: Timeout + retry working together
==================================================
  Timed out after all retries (5ms per attempt)

Example 5: Rich response metadata
==================================================
  Players: 26,450
  ---
  fromCache:      false
  cacheHitType:   (none -- fresh fetch)
  responseTimeMs: 37ms
  requestId:      706ed5f2-c325-4304-8bf8-9fe7a8cb2e97
  rateLimit:      2/600 used, 590 remaining
  ---
  Second call cacheHitType: spec-ttl
  Second call fromCache:    true

Done.
```

---

### Mercenary

> Fetches mercenary dens across New Eden and their spawned tactical operations (MTOs), showing development and anarchy levels.

**Run:** `npm run example:mercenary`

```
Mercenary Dens & Tactical Operations

Mercenary endpoints are not currently available on this ESI version.
These endpoints may be deployed in a future EVE Online patch.
```

---

### Skyhooks

> Queries Upwell sovereignty structures -- sovereignty hubs, orbital skyhooks with silo levels, and currently raidable skyhooks.

**Run:** `npm run example:skyhooks`

```
Skyhooks & Sovereignty Hubs

Skyhook endpoints are not currently available on this ESI version.
These endpoints may be deployed in a future EVE Online patch.
```

---

### Streaming Pagination

> Demonstrates streaming pagination over large ESI result sets, fetching all pages automatically and reporting progress.

**Run:** `npm run example:streaming`

This example streams through the full universe type list using automatic pagination. It produces output for each page fetched (typically 425 pages). Below is a representative excerpt of the first few pages:

```
Streaming Pagination Demo

Fetching all universe types with streaming pagination...
  Page 1: 1000 types (1000 total)
  Page 2: 1000 types (2000 total)
  Page 3: 1000 types (3000 total)
  ...
```

The full run continues through all pages until the complete dataset is retrieved. Total output is omitted here for brevity.

---

### Universe Encyclopedia

> Explores EVE's lore data (ancestries, bloodlines, races, factions), item database (categories, groups, graphics), galaxy statistics (system jumps, kills), and celestial objects (stars, planets, stargates, moons, asteroid belts).

**Run:** `npm run example:universe-encyclopedia`

```
Universe Encyclopedia

Fetching lore data...
Lore Data
--------------------------------------------------
  Ancestries:  43
  Bloodlines:  18
  Races:       6
  Factions:    27

  Race: Caldari
    Bloodline: Deteis
    Bloodline: Achura
    Bloodline: Civire
  ...

Fetching categories & groups...

Item Database
--------------------------------------------------
  Categories: 48
  Groups:     1605

Graphics
--------------------------------------------------
  Total graphics: 6108

Fetching system data...

Galaxy Statistics
--------------------------------------------------
  Systems:        8490
  Constellations: 1184
  Systems with jumps reported: 5082
  Systems with kills reported: 3299

  Jita traffic: 3,437 jumps
  Jita kills: 21 ships, 75 NPCs, 7 pods

Fetching celestial objects...

Celestial Objects (Jita)
--------------------------------------------------
  Star: Jita - Star (type 3796)
  Planet: Jita I (type 2016)
  Stargate: Stargate (Maurasi) -> system 30000140
```

---

### Dogma, Meta & Sovereignty

> Fetches dogma effects, the ESI OpenAPI specification, sovereignty system ownership, and war killmails.

**Run:** `npm run example:dogma-meta-sov`

```
Dogma Effects, Meta & Sovereignty

Dogma Effects
--------------------------------------------------
  Total effects: 3413
  Sample effect: rigBasCapCompManufactureMaterialBonus
    Category: 0

Sovereignty Systems
--------------------------------------------------
  Total sovereignty entries: 5485
  Systems claimed by alliances: 2711
  Top 5 alliances by systems held:
    Alliance 1354830081: 509 systems
    Alliance 99003581: 344 systems
    Alliance 1900696668: 180 systems
    Alliance 99009163: 122 systems
    Alliance 99012042: 107 systems

ESI Meta
--------------------------------------------------
  OpenAPI version: 3.1.0
  API title: EVE Spring Inebriation (ESI) - tranquility
  Paths: 203

War Killmails
--------------------------------------------------
  War 761500: 0 killmails
```

---

## Hybrid Examples

These examples combine public and authenticated endpoints. The public portions work without tokens; authenticated sections are skipped gracefully when credentials are not available.

---

### Character Profile

> Demonstrates how to use the ESI.ts library to gather comprehensive character information by combining multiple API calls efficiently.

**Run:** `npm run example`

```
ESI.ts Character Profile Example
=====================================

Gathering complete profile for character ID: 1689391488
Fetching basic character information...
Fetching detailed profile data in parallel...
Character location unavailable (may be offline or restricted)

============================================================
CHARACTER PROFILE SUMMARY
============================================================
Name: deiseman
Character ID: 1689391488
Birthday: 2/3/2008
Security Status: 0.44

Corporation: Republic Military School [RMS]
Members: 1,619,020
Alliance: None

Portrait URLs:
  64x64: https://images.evetech.net/characters/1689391488/portrait?tenant=tranquility&size=64
  128x128: https://images.evetech.net/characters/1689391488/portrait?tenant=tranquility&size=128
  256x256: https://images.evetech.net/characters/1689391488/portrait?tenant=tranquility&size=256
  512x512: https://images.evetech.net/characters/1689391488/portrait?tenant=tranquility&size=512

Current Location: Unavailable (character may be offline)

============================================================

Total execution time: 146ms
Character profile retrieved successfully!

Cleaning up resources...
Done!
```

---

### Contracts Browser

> Demonstrates browsing public region contracts (no auth) and fetching a character's personal contracts (auth required).

**Run:** `npm run example:contracts`

```
Contracts Browser

Fetching public contracts in The Forge (region 10000002)...
  Found 35000 public contracts

Public Contracts by Type
----------------------------------------
  item_exchange: 34,358
  auction: 516
  courier: 126

Public Contracts by Status
----------------------------------------

Sample Auction Contract #232944688
----------------------------------------
  Price:       60,000,000 ISK
  Buyout:      150,000,000 ISK
  Volume:      4.16 m3
  Expires:     2026-06-30T16:04:54Z
  Bids:        0
  Items:       416
    Type 812 x1 (included)
    Type 1137 x1 (included)
    Type 1137 x1 (included)
    ... and 413 more items

--- Character Contracts ---
Skipped: ESI_ACCESS_TOKEN not set or missing scope esi-contracts.read_character_contracts.v1
```

---

### Cursor Pagination

> ESI uses cursor-based pagination for newer routes like Freelance Jobs.

**Run:** `npm run example:cursor-pagination`

```
Freelance Jobs & Cursor Pagination Examples

These examples use the live ESI Freelance Jobs endpoints.
Public endpoints (no auth needed): listing + detail
Character/Corporation endpoints require ESI_ACCESS_TOKEN.

=== Fetch First Page of Freelance Jobs ===

  Fetched 10 jobs
  Cursor before: 1.GL3hOhrEBFg=
  Cursor after:  1.GL3hUFYRHNg=

  colect and deliver plagioclase
    State: Active | Progress: 0.9%
    Reward: 5349M ISK remaining
  Plagioclase Delivery Service
    State: Active | Progress: 7.3%
    Reward: 250M ISK remaining
  Get started mining Scordite (Read Description)
    State: Active | Progress: 2.7%
    Reward: 730M ISK remaining
  ... and 7 more

=== Manual Cursor Pagination ===

  Page 1: 10 jobs
  Page 2: 0 jobs
  End of dataset reached.

  Total jobs fetched: 10 across 2 pages

=== Auto-fetch All Freelance Jobs ===

  Fetched 10 total freelance jobs
  Active: 10

=== Fetch Job Detail ===

  Job: colect and deliver plagioclase
  Career: Industrialist
  Creator: yankandspank1 000
  Corporation: yankandspank
  Method: DeliverItem
  Expires: 2026-09-25T03:30:00Z
  Max participants: 10000
  Broadcast locations: Bei, Chainelant, Gerek, Nourvukaiken, Villore, ...

=== Polling Pattern (Incremental Updates) ===

  // After initial scan, save the final cursor token:
  let savedCursor = lastPage.cursor.after;

  // Later: check for updates
  const updates = await client.freelanceJobs.getFreelanceJobs(undefined, savedCursor);

Done!
```

---

### Faction Warfare Details

> Fetches FW leaderboards (overall, character, corporation), active faction wars, and character/corporation FW enlistment stats. Auth endpoints gracefully report when not enlisted.

**Run:** `npm run example:faction-details`

**Scopes:** `esi-characters.read_fw_stats.v1`, `esi-corporations.read_fw_stats.v1`

```
Faction Warfare Details

Fetching leaderboards...
Overall Leaderboard
--------------------------------------------------
  ["kills","victory_points"]

Character Leaderboard
--------------------------------------------------
  ["kills","victory_points"]

Corporation Leaderboard
--------------------------------------------------
  ["kills","victory_points"]

Faction Wars
--------------------------------------------------
  Active wars: 12
    Faction 500004 vs 500001
    Faction 500010 vs 500001
    Faction 500003 vs 500002
    ...

Character FW Stats
--------------------------------------------------
  Character is not enlisted in faction warfare

Corporation FW Stats
--------------------------------------------------
  Corporation is not enlisted in faction warfare
```

---

## Authenticated Examples

These examples require a valid `ESI_ACCESS_TOKEN` with the scopes listed for each example. Set your token in a `.env` file or as an environment variable before running.

---

### Wallet Overview

> Demonstrates character and corporation wallet operations including ISK balance, journal entries, and market transactions.

**Run:** `npm run example:wallet`

**Scopes:** `esi-wallet.read_character_wallet.v1`

**Expected Output:**

```
Wallet Overview

ISK Balance
----------------------------------------
  Current balance: <character ISK balance>

Wallet Journal (recent entries)
----------------------------------------
  <date> | <ref_type> | <amount> ISK | <description>
  <date> | <ref_type> | <amount> ISK | <description>
  ...

Market Transactions (recent)
----------------------------------------
  <date> | <buy/sell> | <type_id> x<quantity> | <unit_price> ISK
  ...
```

---

### Skills Overview

> Demonstrates character skill inspection including trained skills, skill queue, and neural remap attributes.

**Run:** `npm run example:skills`

**Scopes:** `esi-skills.read_skills.v1`, `esi-skills.read_skillqueue.v1`, `esi-characters.read_attributes.v1` (optional)

**Expected Output:**

```
Skills Overview

Total Skill Points: <total SP>
Unallocated SP:     <unallocated>

Skills by Level
----------------------------------------
  Level 5: <count> skills
  Level 4: <count> skills
  Level 3: <count> skills
  ...

Top 5 Skills by SP
----------------------------------------
  <skill_name>: <SP> SP (Level <level>)
  ...

Skill Queue
----------------------------------------
  <position>. <skill_name> to level <level> - finishes <date>
  ...
```

---

### Assets Inventory

> Demonstrates character asset management: listing items, looking up locations and names in bulk via POST, and summarizing inventory.

**Run:** `npm run example:assets`

**Scopes:** `esi-assets.read_assets.v1`

**Expected Output:**

```
Assets Inventory

Total items: <count>

Assets by Location
----------------------------------------
  <location_name>: <count> items
  <location_name>: <count> items
  ...

Named Assets
----------------------------------------
  <item_id>: <custom_name> (<type_id>)
  ...
```

---

### Killmails

> Demonstrates the two-step killmail lookup: first fetch recent killmail summaries for a character (auth required), then look up full details for each killmail using the public endpoint.

**Run:** `npm run example:killmails`

**Scopes:** `esi-killmails.read_killmails.v1`

**Expected Output:**

```
Killmail History

Recent Killmails
----------------------------------------
  Kill #<killmail_id> on <date>
    Victim: <character_name> (<corp_name>)
    Ship:   <ship_type>
    Damage: <total_damage>
    Attackers: <count>
    Final blow: <attacker_name> in <ship_type>
    Items destroyed: <count>
  ...
```

---

### Fleet Operations

> Demonstrates fleet management: checking a character's current fleet, fetching fleet details, listing members, and inspecting wing/squad structure.

**Run:** `npm run example:fleet`

**Scopes:** `esi-fleets.read_fleet.v1`, `esi-fleets.write_fleet.v1`

**Expected Output:**

```
Fleet Operations

Fleet Info
----------------------------------------
  Fleet ID: <fleet_id>
  Boss:     <is_boss>
  Role:     <role>
  MOTD:     <message_of_the_day>

Members (<count>)
----------------------------------------
  <character_name> | <role> | <ship_type> | <system_name>
  ...

Wings & Squads
----------------------------------------
  Wing: <wing_name> (ID: <wing_id>)
    Squad: <squad_name> (ID: <squad_id>)
    ...
```

---

### Mail Inbox

> Demonstrates character mail operations: reading inbox headers, viewing mail labels, listing mailing lists, and reading individual messages.

**Run:** `npm run example:mail`

**Scopes:** `esi-mail.read_mail.v1`, `esi-mail.send_mail.v1`, `esi-mail.organize_mail.v1`

**Expected Output:**

```
Mail Inbox

Labels
----------------------------------------
  <label_id>: <label_name> (<unread_count> unread)
  ...

Mailing Lists
----------------------------------------
  <list_id>: <list_name>
  ...

Inbox (recent messages)
----------------------------------------
  [<date>] <subject>
    From: <sender_id> | Labels: <label_ids>
  ...
```

---

### Location Tracker

> Demonstrates real-time character location tracking: current system, online status, and current ship.

**Run:** `npm run example:location`

**Scopes:** `esi-location.read_location.v1`, `esi-location.read_online.v1`, `esi-location.read_ship_type.v1`

**Expected Output:**

```
Location Tracker

Online Status
----------------------------------------
  Online:     <true/false>
  Last login: <date>
  Last logout: <date>

Current Location
----------------------------------------
  System:    <system_name> (<security_status>)
  Station:   <station_name> (if docked)
  Structure: <structure_name> (if in citadel)

Current Ship
----------------------------------------
  Ship type: <ship_type_id>
  Ship name: <ship_name>
```

---

### Fittings and Clones

> Demonstrates ship fitting management and clone state inspection.

**Run:** `npm run example:fittings`

**Scopes:** `esi-fittings.read_fittings.v1`, `esi-clones.read_clones.v1`, `esi-clones.read_implants.v1`

**Expected Output:**

```
Fittings & Clones

Saved Fittings (<count>)
----------------------------------------
  <fitting_name> - <ship_type>
    <slot>: <module_type> x<quantity>
    ...
  ...

Clone Status
----------------------------------------
  Home location: <station/structure>
  Jump clones:   <count>
  Last clone jump: <date>

Active Implants
----------------------------------------
  <implant_type_id>
  ...
```

---

### Contacts

> Demonstrates reading character contacts with standings and labels, and shows the available write operations (add, edit, delete contacts).

**Run:** `npm run example:contacts`

**Scopes:** `esi-characters.read_contacts.v1`, `esi-characters.write_contacts.v1`

**Expected Output:**

```
Contacts

Labels
----------------------------------------
  <label_id>: <label_name>
  ...

Contacts by Standing
----------------------------------------
  Excellent (10.0):
    <contact_name> (<contact_type>)
  Good (5.0):
    <contact_name> (<contact_type>)
  Neutral (0.0):
    <contact_name> (<contact_type>)
  Bad (-5.0):
    <contact_name> (<contact_type>)
  Terrible (-10.0):
    <contact_name> (<contact_type>)
```

---

### Access Lists

> Retrieves an access list (ACL) and displays its entries grouped by entity type.

**Run:** `npm run example:access-lists`

**Scopes:** ESI access-lists scope

**Expected Output:**

```
Access Lists

ACL Entries by Entity Type
----------------------------------------
  Characters:
    <character_id>: <access_level>
  Corporations:
    <corporation_id>: <access_level>
  Alliances:
    <alliance_id>: <access_level>
```

---

### Token Refresh

> Demonstrates automatic token refresh using the onTokenRefresh callback.

**Run:** `npm run example:token-refresh`

**Requires:** `ESI_ACCESS_TOKEN`, `ESI_REFRESH_TOKEN`, `ESI_CLIENT_ID`

**Expected Output:**

```
Token Refresh Demo

1. Creating client with onTokenRefresh callback...
2. Making request with current token...
   Character wallet balance retrieved successfully.

3. Simulating expired token scenario...
   Token expired - onTokenRefresh callback fired.
   New access token received and stored.
   Retrying request with refreshed token...
   Request succeeded after token refresh.

Token refresh flow completed successfully.
```

---

### Character Details

> Fetches 10 character-specific endpoints: agent research, blueprints, roles, standings, titles, contact notifications, corporation history, jump fatigue, medals, and notifications.

**Run:** `npm run example:character-details`

**Scopes:** `esi-characters.read_agents_research.v1`, `esi-characters.read_blueprints.v1`, `esi-characters.read_corporation_roles.v1`, `esi-characters.read_standings.v1`, `esi-characters.read_titles.v1`, `esi-characters.read_notifications.v1`, `esi-characters.read_fatigue.v1`, `esi-characters.read_medals.v1`

```
Character Details

Fetching character data...
Agent Research
--------------------------------------------------
  Active research agents: 0

Blueprints
--------------------------------------------------
  Total blueprints: 6
  Originals: 1, Copies: 5

Roles
--------------------------------------------------
  Roles: 54
  Roles at HQ: 54
  Roles at base: 54
  Roles at other: 54

Standings
--------------------------------------------------
  Total standings: 21
    faction 500001: 0.032385497
    faction 500002: -0.023137860000000003
    ... and 16 more

Corporation History
--------------------------------------------------
  Corporations joined: 4
    6/12/2012: Corp 98135622 (record 21308888)
    11/6/2011: Corp 1000072 (record 17056852)
    ...

Jump Fatigue
--------------------------------------------------
  No jump fatigue

Medals
--------------------------------------------------
  Medals earned: 0

Notifications
--------------------------------------------------
  Recent notifications: 16
    15/9/2025 | GameTimeAdded | from corporation 1000125
    ...
```

---

### Calendar & Search

> Demonstrates calendar event listing, event detail, event attendees, and character search.

**Run:** `npm run example:calendar-search`

**Scopes:** `esi-calendar.read_calendar_events.v1`

```
Calendar & Search

Calendar Events
--------------------------------------------------
  Upcoming events: 0
  No upcoming calendar events

Character Search
--------------------------------------------------
  Search for "Chribba": 26 result(s)
    Character ID: 90404873
    Character ID: 90946549
    Character ID: 1277406816
    Character ID: 95649518
    Character ID: 91204021
```

---

### Loyalty & Planetary Interaction

> Shows loyalty point balances, LP store offers, planetary colonies with layouts, customs offices, and PI schematics.

**Run:** `npm run example:loyalty-pi`

**Scopes:** `esi-characters.read_loyalty.v1`, `esi-planets.manage_planets.v1`, `esi-corporations.read_customs_offices.v1` (optional)

```
Loyalty Points & Planetary Interaction

Loyalty Points
--------------------------------------------------
  LP balances with 0 corporation(s)

LP Store Offers (CONCORD)
--------------------------------------------------
  Total offers: 234
    Offer 15360: type 3089, 37500 LP + 37,500,000 ISK
    Offer 15361: type 3092, 250000 LP + 250,000,000 ISK
    ... and 229 more

Planetary Colonies
--------------------------------------------------
  Active colonies: 0

Corporation Customs Offices
--------------------------------------------------
  Customs offices: 0

PI Schematic
--------------------------------------------------
  Schematic 65: Superconductors
  Cycle time: 3600s
```

---

### Industry & Mining

> Demonstrates character industry jobs, mining ledger, corporation industry jobs, moon extraction timers, mining observers, and corporation killmails. Director-only endpoints are gracefully skipped.

**Run:** `npm run example:industry-mining`

**Scopes:** `esi-industry.read_character_jobs.v1`, `esi-industry.read_character_mining.v1`, `esi-industry.read_corporation_jobs.v1`, `esi-industry.read_corporation_mining.v1`, `esi-killmails.read_corporation_killmails.v1`

```
Industry Jobs & Mining

Character Industry Jobs
--------------------------------------------------
  Total jobs: 0
  Active: 0

Mining Ledger
--------------------------------------------------
  Entries: 0

Corporation Industry Jobs
--------------------------------------------------
  Total corp jobs: 0

Moon Extraction Timers
--------------------------------------------------
  Moon extractions: endpoint not available — skipped

Mining Observers
--------------------------------------------------
  Mining observers: endpoint not available — skipped

Corporation Killmails
--------------------------------------------------
  Recent killmails: 0
```

---

### Market Orders & Groups

> Shows character and corporation market orders, order history, market group hierarchy, and structure market orders.

**Run:** `npm run example:market-orders`

**Scopes:** `esi-markets.read_character_orders.v1`, `esi-markets.read_corporation_orders.v1`, `esi-markets.structure_markets.v1` (optional)

```
Market Orders & Groups

Character Orders
--------------------------------------------------
  Active orders: 0

  Order history: 0 orders

Corporation Orders
--------------------------------------------------
  Active corp orders: 0
  Corp order history: 0

Market Groups
--------------------------------------------------
  Total market groups: 2102

  Sample group: Blueprints & Reactions (ID: 2)
    Description: Blueprints are data items used in industry for manufacturing...
    Types: 0

Structure Market Orders
--------------------------------------------------
  Requires structure access — skipped
```

---

### Corporation Details

> Comprehensive corporation data: alliance history, icon, NPC corps (public), plus 18 authenticated director-level endpoints including blueprints, divisions, facilities, medals, members, roles, shareholders, standings, starbases, structures, and titles.

**Run:** `npm run example:corporation-details`

**Scopes:** `esi-corporations.read_blueprints.v1`, `esi-corporations.read_container_logs.v1`, `esi-corporations.read_divisions.v1`, `esi-corporations.read_facilities.v1`, `esi-corporations.read_medals.v1`, `esi-corporations.read_corporation_membership.v1`, `esi-corporations.read_standings.v1`, `esi-corporations.read_starbases.v1`, `esi-corporations.read_structures.v1`, `esi-corporations.read_titles.v1`

```
Corporation Details

Public Data
==================================================

Alliance History (1 entries)
--------------------------------------------------
  2012-09-02T20:30:00Z: alliance none

Corporation Icon
--------------------------------------------------
  64x64:   https://images.evetech.net/corporations/98135622/logo?...&size=64
  128x128: https://images.evetech.net/corporations/98135622/logo?...&size=128
  256x256: https://images.evetech.net/corporations/98135622/logo?...&size=256

NPC Corporations
--------------------------------------------------
  Total NPC corps: 283

Authenticated Data (director roles required)
==================================================

Blueprints
--------------------------------------------------
  Corporation blueprints: 0

Divisions
--------------------------------------------------
  Hangar divisions: 7
  Wallet divisions: 7

Members
--------------------------------------------------
  Member count: 9
  Member limit: 20
  Members with titles: 9
  Tracked members: 9

Roles
--------------------------------------------------
  Members with roles: 9
  Role change history: 0

Shareholders
--------------------------------------------------
  Shareholders: 1

Standings
--------------------------------------------------
  Corporation standings: 210

Titles
--------------------------------------------------
  Defined titles: 16
```

---

### Corp Contracts & Wallet

> Demonstrates character contract bids/items, corporation contracts, alliance and corporation contacts, corporation assets, corporation wallets with journal and transactions, and public structure lookup.

**Run:** `npm run example:corp-contracts-wallet`

**Scopes:** `esi-contracts.read_character_contracts.v1`, `esi-contracts.read_corporation_contracts.v1`, `esi-alliances.read_contacts.v1`, `esi-corporations.read_contacts.v1`, `esi-assets.read_corporation_assets.v1`, `esi-wallet.read_corporation_wallets.v1`

```
Contracts, Contacts, Assets & Wallet

Character Contract Bids & Items
--------------------------------------------------
  Character contracts: 0
  No contracts found

Corporation Contracts
--------------------------------------------------
  Corporation contracts: 0

Alliance Contacts
--------------------------------------------------
  Alliance contacts: requires corporation/alliance roles — skipped
  Alliance contact labels: requires corporation/alliance roles — skipped

Corporation Contacts
--------------------------------------------------
  Corporation contacts: 2
  Corporation contact labels: 0

Corporation Assets
--------------------------------------------------
  Corporation assets: 0

Corporation Wallets
--------------------------------------------------
  Wallet divisions: 7
    Division 1: 647,999 ISK
    Division 2: 0 ISK
    Division 3: 0 ISK
    Division 4: 0 ISK
    Division 5: 0 ISK
    Division 6: 0 ISK
    Division 7: 0 ISK

  Division 1 journal entries: 0
  Division 1 transactions: 0

Public Structures
--------------------------------------------------
  Public structure IDs: 939
  Structure 1053825884161: Shihuken - Prestige R&D
    System: 30000130, Type: 35825
```
