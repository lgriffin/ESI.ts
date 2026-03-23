/**
 * ESI.ts Example: Route Planner
 *
 * Calculates the shortest route between two solar systems
 * and looks up the name of each system along the way.
 *
 * Usage: npm run example:route
 */
import { EsiClient } from '../src/EsiClient';

const JITA_SYSTEM_ID = 30000142;
const AMARR_SYSTEM_ID = 30002187;

async function main() {
  const client = new EsiClient();

  try {
    console.log(`Route: Jita -> Amarr\n`);

    const route = await client.route.getRoute(JITA_SYSTEM_ID, AMARR_SYSTEM_ID);

    console.log(`Total jumps: ${route.length - 1}\n`);

    // Resolve system names by looking up each system
    const systems = await Promise.all(
      route.map((id: number) => client.universe.getSystemById(id))
    );

    console.log('Route');
    console.log('-'.repeat(40));
    for (let i = 0; i < route.length; i++) {
      const name = systems[i].name ?? `System ${route[i]}`;
      const sec = systems[i].security_status?.toFixed(2) ?? '?';
      const prefix = i === 0 ? 'START' : i === route.length - 1 ? 'END  ' : `  ${String(i).padStart(3)}`;
      console.log(`  ${prefix}  ${name} (${sec})`);
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
