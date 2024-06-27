# ESI.ts

This repository contains a TypeScript implementation for the EVE Online API (ESI). This is inspired by the JavaScript implementation at https://github.com/ExperiBass/esiJS

The project is a personal goal for me, I'm a lapsed developer (actively an Engineering Manager) going back to upskill in TypeScript after a decade away from development in Node.js and Java. Why TypeScript? Familarity with JavaScript and a hopefully better experience for anyone using my app.

In my absence from coding, I have generated a lot of knowledge on concepts around architecture and design. So the intent of this application is to:

- Build a clean architecture inspired application -- NOTE This will not be perfect, I'm going to try and adhere to it as best I can
- Bring in Behaviour Driven Development to describe the intentions of the API for non expert programmers
- Try and pursue a red-green TDD style approach for the APIs
- Seperate the API into small, consumable usage
- Look at design patterns, currently playing around with a Builder Pattern to eventually look at tailored client usage where we can have a slimmer client experience and create customised and narrower API profiles
- Figure out how github actions work, I know enough of Jenkins to hopefully figure this out
- Figure out caching and API management
- Figure out auth flows and longer term token management and see can the API help here.
- Develop a useful user guide and documentation

This is most likely overkill for most end users, my goal is maintability and extensibility of the API and try and get a best practices project off the ground. The project is in flight, this first formal public commit is more to expose the intention and architecture. The factions API was chosen first just to have a mix of open calls and auth calls. This did not follow any best practices with testing and was an attempt to just get a functional API working. A lot of time was spent battling tooling (cucumber.js does not like TypeScript) and different integrations but this is at a point now where I am happy with the intentions. As I progress through each future API grouping my aim is to follow best practices and create a hopefully useful app for the EVE Online Community.

ISK donations are always welcome to deiseman in game, reach out to chat about any ideas or how the design and API exposure could benefit your app.



## API Implementation Status

As progress is made I will try and update this to show what is functional and in place.

### Faction Warfare
- [x] Get Faction Warfare Leaderboards - Characters ![✔️](https://img.shields.io/badge/Status-Implemented-brightgreen)
- [x] Get Faction Warfare Leaderboards - Corporations ![✔️](https://img.shields.io/badge/Status-Implemented-brightgreen)
- [x] Get Faction Warfare Leaderboards - Overall ![✔️](https://img.shields.io/badge/Status-Implemented-brightgreen)
- [x] Get Faction Warfare Stats ![✔️](https://img.shields.io/badge/Status-Implemented-brightgreen)
- [x] Get Faction Warfare Character Stats ![✔️](https://img.shields.io/badge/Status-Implemented-brightgreen)
- [x] Get Faction Warfare Corporation Stats ![✔️](https://img.shields.io/badge/Status-Implemented-brightgreen)
- [x] Get Faction Warfare Systems ![✔️](https://img.shields.io/badge/Status-Implemented-brightgreen)
- [x] Get Faction Warfare Wars ![✔️](https://img.shields.io/badge/Status-Implemented-brightgreen)

### Alliances
- [ ] Get Alliance by ID ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Alliance Corporations ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Alliances ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Alliance Icons ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)

### Bookmarks
- [ ] Get Character Bookmarks ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Character Bookmark Folders ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Corporation Bookmarks ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Corporation Bookmark Folders ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)

### Calendar
- [ ] Get Character Calendar ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Calendar Event by ID ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Calendar Event Attendees ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Respond to Calendar Event ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)

### Characters
- [ ] Get Character by ID ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Character Agents Research ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Character Blueprints ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Character Corporation History ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Character Medals ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Character Notifications ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Character Portrait ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Character Roles ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)

### Clones
- [ ] Get Clones ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Jump Clones ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Implants ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)

### Contacts
- [ ] Get Character Contacts ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Corporation Contacts ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Alliance Contacts ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Add Character Contacts ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Edit Character Contacts ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Delete Character Contacts ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)

### Contracts
- [ ] Get Character Contracts ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Corporation Contracts ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Public Contracts ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Contract Bids ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Contract Items ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)

### Corporations
- [ ] Get Corporation by ID ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Corporation Assets ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Corporation Blueprints ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Corporation Divisions ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Corporation Facilities ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Corporation Icons ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Corporation Medals ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Corporation Members ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)

### Dogma
- [ ] Get Dogma Attributes ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Dogma Effects ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)

### Fittings
- [ ] Get Character Fittings ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Create Character Fitting ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Delete Character Fitting ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)

### Fleets
- [ ] Get Fleet by ID ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Fleet Members ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Invite Fleet Member ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Kick Fleet Member ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Update Fleet Member ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Fleet Wings ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)

### Incursions
- [ ] Get Incursions ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)

### Industry
- [ ] Get Industry Facilities ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Industry Systems ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Character Industry Jobs ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
- [ ] Get Corporation Industry Jobs ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)

### Insurance
- [ ] Get Insurance Prices ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)

### Killmails
- [ ] Get Character Killmails ![❌](https://img.shields.io/badge/Status-Not_Implemented-red)
