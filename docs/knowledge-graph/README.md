# Knowledge Graph (graphify)

ESI.ts keeps a [graphify](https://github.com/Graphify-Labs/graphify) knowledge graph of its source code so agents and reviewers can answer architecture questions without re-reading the tree.

## Files in this directory

| File              | Purpose                                                          |
| ----------------- | ---------------------------------------------------------------- |
| `GRAPH_REPORT.md` | Generated graph report: commit, node/edge counts, community hubs |

`graphify-out/graph.json` and `graphify-out/graph.html` are generated in the graph worktree and excluded from this repository.

## Where the graph is built

The graph is built in a clean worktree so untracked personal files (`SOUL.md`, `USER.md`, `memory/`, `.openflow/`) never enter the corpus.

- **Windows worktree:** `D:\code\ESI.ts-rw-graphify`
- **Branch:** `feat/graphify-master` (kept in sync with `origin/master`)

## Regenerating

```bash
# 1. Sync the worktree to current master
cd D:/code/ESI.ts-rw-graphify
git fetch origin master
git checkout -B feat/graphify-master origin/master

# 2. Re-extract code (no API key needed for code-only)
graphify extract . --code-only

# 3. Cluster and regenerate GRAPH_REPORT.md + graph.html
graphify cluster-only . --no-label

# 4. Copy the report back into the main checkout
cp -f graphify-out/GRAPH_REPORT.md /path/to/ESI.ts/docs/knowledge-graph/GRAPH_REPORT.md
```

`graphify update .` (incremental, no LLM) is enough for small changes; a full `extract` + `cluster-only` is needed after refactors that delete code.

## Querying

```bash
# Natural-language traversal
graphify query "how does a request flow to fetch" --graph graphify-out/graph.json

# Shortest path between two symbols
graphify path "handleRequest" "fetch" --graph graphify-out/graph.json --undirected

# Most-connected nodes (architectural hubs)
graphify god-nodes --graph graphify-out/graph.json

# Reverse: what depends on a given symbol?
graphify affected "cachePolicy" --depth 2 --graph graphify-out/graph.json
```

The commit the graph was built from is recorded in `GRAPH_REPORT.md` under _Graph Freshness_. Check it is current before trusting the answer.

## Ignoring

`.graphifyignore` at the repository root excludes generated and vendored content from the corpus:

- `okf/`, `src/types/generated/`, `src/core/endpoints/esi-*.generated.ts`
- `dist/`, `coverage/`, `reports/`, `docs-site/public/`, `node_modules/`
- `etc/esi.ts.api.md`, `.beads/`
- `*.min.js`, `*.min.mjs`

## MCP server

graphify can be served as an MCP server (stdio or HTTP) for agent integration:

```bash
graphify-mcp --graph graphify-out/graph.json --transport stdio
# or
graphify-mcp --graph graphify-out/graph.json --transport http --port 8080
```
