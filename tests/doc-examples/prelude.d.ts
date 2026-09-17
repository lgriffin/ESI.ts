/**
 * The shared prelude for documentation examples (see
 * guides/DOCUMENTATION.md, "Documentation examples are checked").
 *
 * Documentation blocks are usually fragments: they use a `client` built in an
 * earlier block, or a `characterId` the reader supplies. This file declares
 * those names as globals, typed against the installed package, so fragments
 * type-check as written. Each block is compiled as its own ES module, so a
 * block that declares or imports one of these names itself shadows the global
 * and is checked on its own declaration.
 *
 * Declarations here exist only for the type-checker. A `runnable` block runs
 * with none of them defined, so it must build everything it uses.
 *
 * Keep the list to names the docs actually use, and type each one as
 * precisely as a reader would have it; an `any` here would hide mistakes in
 * every block that uses the name.
 */

// Classes the docs use after the Quick Start has shown their import.
declare const EsiClient: typeof import('@lgriffin/esi.ts').EsiClient;
type EsiClient = import('@lgriffin/esi.ts').EsiClient;
declare const SdeDataProvider: typeof import('@lgriffin/esi.ts/sde').SdeDataProvider;
type SdeDataProvider = import('@lgriffin/esi.ts/sde').SdeDataProvider;
type EveType = import('@lgriffin/esi.ts/sde').EveType;
type SolarSystem = import('@lgriffin/esi.ts/sde').SolarSystem;

// Clients and providers built in an earlier block.
declare const client: import('@lgriffin/esi.ts').EsiClient;
declare const tokens: import('@lgriffin/esi.ts').EsiTokenManager;
declare const sde: import('@lgriffin/esi.ts/sde').IStaticDataProvider;

// Values the reader supplies.
declare const characterId: number;
declare const characterIds: number[];
declare const corporationId: number;
declare const regionId: number;
declare const typeId: number;
declare const typeIds: number[];
declare const largeIdArray: number[];
declare const token: string;
declare const newToken: string;
declare const initialToken: string;
declare const myClientId: string;
declare const myRefreshToken: string;
declare const myRefreshFunction: import('@lgriffin/esi.ts').TokenProvider;
declare const customRetryStrategy: import('@lgriffin/esi.ts').IRetryStrategy;
declare const code: string;
declare const codeFromCallback: string;
declare const state: string;
declare const scopes: string[];
declare const someData: unknown;

// The reader's own application code.
declare function scheduleRetry(characterId: number): void;
declare const metrics: {
  histogram(name: string, value: number, tags?: Record<string, unknown>): void;
};
declare const app: {
  post(
    path: string,
    handler: (req: { body: unknown }, res: unknown) => void,
  ): void;
};

// Third-party modules the docs import that the checker does not install.
declare module 'dotenv/config';
declare module 'winston';
