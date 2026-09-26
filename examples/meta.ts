/**
 * ESI.ts Example: ESI Metadata
 *
 * Reads ESI's own metadata: the API name, the compatibility dates it accepts,
 * the latest changelog entries, and the health of each route.
 *
 * No authentication required.
 *
 * Usage: npm run example:meta
 *
 * @nightly public
 */
import { EsiClient } from '../src/EsiClient';

async function main() {
  const client = new EsiClient();

  try {
    const { name } = await client.meta.getName();
    console.log(`API: ${name}`);

    const { compatibility_dates: dates } =
      await client.meta.getCompatibilityDates();
    console.log(
      `Compatibility dates: ${dates.length}, newest ${dates.at(-1) ?? 'none'}`,
    );

    const changelog = await client.meta.getChangelog();
    const [latestDate] = Object.keys(changelog).sort().reverse();
    const latest = latestDate ? (changelog[latestDate] ?? []) : [];
    console.log(`\nChangelog for ${latestDate ?? 'no date'}:`);
    for (const entry of latest.slice(0, 5)) {
      const breaking = entry.is_breaking ? ' (breaking)' : '';
      console.log(
        `  ${entry.method} ${entry.path}${breaking}: ${entry.description}`,
      );
    }

    const { routes } = await client.meta.getStatus();
    const unhealthy = routes.filter((route) => route.status !== 'OK');
    console.log(
      `\nRoute health: ${routes.length - unhealthy.length} of ${routes.length} OK`,
    );
    for (const route of unhealthy.slice(0, 10)) {
      console.log(`  ${route.status}: ${route.method} ${route.path}`);
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
