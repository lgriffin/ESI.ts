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

## Documentation

This documentation is auto-generated from the TypeScript codebase using [TypeDoc](https://typedoc.org/).

[![Documentation](https://img.shields.io/badge/docs-latest-blue.svg)](https://<your-username>.github.io/<repo-name>/)

