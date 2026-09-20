/**
 * ESI.ts Example: SDE Market Group Tree
 *
 * Walks the market group hierarchy recursively to display the full
 * market category tree, optionally listing types in each leaf group.
 *
 * Setup: npx ts-node scripts/sde-ingest.ts --output sde-data
 * Usage: npx ts-node examples/sde-market-tree.ts
 */
import { SdeDataProvider } from '../src/sde';
import type { MarketGroup } from '../src/sde/types';

function printTree(
  sde: ReturnType<typeof SdeDataProvider.fromDirectory>,
  group: MarketGroup,
  depth: number = 0,
  maxDepth: number = 3,
) {
  const indent = '  '.repeat(depth);
  const typeCount = group.hasTypes
    ? ` [${sde.getTypesByMarketGroup(group.marketGroupId).length} types]`
    : '';
  console.log(`${indent}- ${group.name} (${group.marketGroupId})${typeCount}`);

  if (depth >= maxDepth) return;

  const children = sde.getMarketGroupsByParent(group.marketGroupId);
  for (const child of children) {
    printTree(sde, child, depth + 1, maxDepth);
  }
}

function main() {
  const sde = SdeDataProvider.fromDirectory(process.env.SDE_DATA_PATH || './sde-data');

  try {
    const roots = sde.getRootMarketGroups();
    console.log(`=== Market Group Tree (${roots.length} root categories) ===\n`);

    for (const root of roots) {
      printTree(sde, root);
    }

    // Search example
    console.log('\n--- Search: "Drone" market groups ---');
    const droneGroups = sde.searchMarketGroupsByName('Drone', 10);
    for (const g of droneGroups) {
      const parent = g.parentGroupId
        ? sde.getMarketGroup(g.parentGroupId)
        : null;
      console.log(`  ${g.name} (parent: ${parent?.name ?? 'root'})`);
    }
  } finally {
    sde.close();
  }
}

main();
