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
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    const { current, history } = await client.meta.getName();
    log.info(`API: ${current} (${history.length} earlier names)`);

    const { compatibility_dates: dates } =
      await client.meta.getCompatibilityDates();
    log.info(
      `Compatibility dates: ${dates.length}, newest ${[...dates].sort().at(-1) ?? 'none'}`,
    );

    const yaml = await client.meta.getOpenApiYaml();
    const [, yamlVersion] = /^openapi: *['"]?([^'"\s]+)/m.exec(yaml) ?? [];
    log.info(
      `OpenAPI YAML: ${yaml.length} characters, openapi ${yamlVersion ?? 'unknown'}`,
    );

    const { changelog } = await client.meta.getChangelog();
    const [latestDate] = Object.keys(changelog).sort().reverse();
    const latest = latestDate ? (changelog[latestDate] ?? []) : [];
    log.info(`\nChangelog for ${latestDate ?? 'no date'}:`);
    for (const entry of latest.slice(0, 5)) {
      log.info(
        `  ${entry.method} ${entry.path} (${entry.type}): ${entry.description}`,
      );
    }

    const { routes } = await client.meta.getStatus();
    const unhealthy = routes.filter((route) => route.status !== 'OK');
    log.info(
      `\nRoute health: ${routes.length - unhealthy.length} of ${routes.length} OK`,
    );
    for (const route of unhealthy.slice(0, 10)) {
      log.info(`  ${route.status}: ${route.method} ${route.path}`);
    }
  } catch (err) {
    log.error('Request failed', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
