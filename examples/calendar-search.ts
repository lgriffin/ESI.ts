/**
 * ESI.ts Example: Calendar & Search
 *
 * Demonstrates calendar event listing, event detail, event attendees,
 * and character search.
 *
 * REQUIRES AUTHENTICATION — set ESI_ACCESS_TOKEN in your environment.
 *
 * Usage: npm run example:calendar-search
 *
 * @nightly auth
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

const CHARACTER_ID = 90439768;

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    log.info('Calendar & Search\n');

    // --- Calendar Events ---
    log.info('Calendar Events');
    log.info('-'.repeat(50));
    const events = await client.calendar.getCalendarEvents(CHARACTER_ID);
    log.info(`  Upcoming events: ${events.length}`);

    if (events.length > 0) {
      for (const evt of events.slice(0, 5)) {
        log.info(`    [${evt.event_id}] ${evt.title} — ${evt.event_date}`);
      }
      if (events.length > 5) log.info(`    ... and ${events.length - 5} more`);

      const firstEvent = events[0]!;
      // ESI marks every calendar entry field optional, event_id included;
      // an entry without one cannot be looked up, and the try below reports it.
      const eventId = firstEvent.event_id ?? 0;
      log.info(`\n  Event Detail: ${firstEvent.title}`);
      log.info('  ' + '-'.repeat(48));
      try {
        const detail = await client.calendar.getCalendarEventById(
          CHARACTER_ID,
          eventId,
        );
        log.info(`    Date:      ${detail.date}`);
        log.info(`    Duration:  ${detail.duration} minutes`);
        log.info(`    Owner:     ${detail.owner_name} (${detail.owner_type})`);
        log.info(`    Response:  ${detail.response}`);
        log.info(`    Importance: ${detail.importance}`);

        const attendees = await client.calendar.getEventAttendees(
          CHARACTER_ID,
          eventId,
        );
        log.info(`    Attendees: ${attendees.length}`);
        for (const a of attendees.slice(0, 5)) {
          log.info(`      Character ${a.character_id}: ${a.event_response}`);
        }
        if (attendees.length > 5)
          log.info(`      ... and ${attendees.length - 5} more`);
      } catch (err) {
        if (err instanceof EsiError && err.statusCode === 404) {
          log.info('    Event detail not available');
        } else {
          throw err;
        }
      }
    } else {
      log.info('  No upcoming calendar events');
    }

    // --- Character Search ---
    log.info('\nCharacter Search');
    log.info('-'.repeat(50));
    const searchResult = await client.search.characterSearch(
      CHARACTER_ID,
      'Chribba',
      ['character'],
    );
    const charResults =
      (searchResult as Record<string, number[]>).character || [];
    log.info(`  Search for "Chribba": ${charResults.length} result(s)`);
    for (const id of charResults.slice(0, 5)) {
      log.info(`    Character ID: ${id}`);
    }
  } catch (err) {
    if (
      err instanceof EsiError &&
      (err.statusCode === 401 || err.statusCode === 403)
    ) {
      log.error('Authentication required. Set ESI_ACCESS_TOKEN.');
    } else {
      log.error('Request failed', { error: err });
    }
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
