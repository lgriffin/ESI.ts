# SDE Module

The Static Data Export module: typed, in-memory lookups over CCP's YAML export, published as the `@lgriffin/esi.ts/sde` and `@lgriffin/esi.ts/sde/memory` sub-paths.

The documentation lives with the other guides:

- [guides/SDE.md](../../guides/SDE.md), the front door: what the SDE is next to the ESI client, the C4 diagrams and the isolation rule
- [guides/sde/REFERENCE.md](../../guides/sde/REFERENCE.md), the module reference: quick start, every `IStaticDataProvider` method by family, testing, the ingestion CLI and the measured load cost
- [guides/sde/USAGE.md](../../guides/sde/USAGE.md), provider patterns and query examples
- [guides/sde/ARCHITECTURE.md](../../guides/sde/ARCHITECTURE.md), the load pipeline, storage and entity relationships
- [guides/sde/DEVELOPER_GUIDE.md](../../guides/sde/DEVELOPER_GUIDE.md), adding an entity type or a YAML file to the registry
- [guides/sde/API_CONTRACTS.md](../../guides/sde/API_CONTRACTS.md), the method contracts
- [guides/sde/TESTING.md](../../guides/sde/TESTING.md), the testing scorecard: every tier, its measured score and the floor that holds it

The layout of this directory is described in [guides/SDE.md](../../guides/SDE.md#c4-level-3--component-the-sde-module).
