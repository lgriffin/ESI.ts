/**
 * ESI.ts Example: Calendar & Search
 *
 * Demonstrates calendar event listing, event detail, event attendees,
 * and character search.
 *
 * REQUIRES AUTHENTICATION — set ESI_ACCESS_TOKEN in your environment.
 *
 * Usage: npm run example:calendar-search
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

const CHARACTER_ID = 90439768;

async function main() {
  const client = new EsiClient();

  try {
    console.log('Calendar & Search\n');

    // --- Calendar Events ---
    console.log('Calendar Events');
    console.log('-'.repeat(50));
    const events = await client.calendar.getCalendarEvents(CHARACTER_ID);
    console.log(`  Upcoming events: ${events.length}`);

    if (events.length > 0) {
      for (const evt of events.slice(0, 5)) {
        console.log(`    [${evt.event_id}] ${evt.title} — ${evt.event_date}`);
      }
      if (events.length > 5) console.log(`    ... and ${events.length - 5} more`);

      const firstEvent = events[0]!;
      console.log(`\n  Event Detail: ${firstEvent.title}`);
      console.log('  ' + '-'.repeat(48));
      try {
        const detail = await client.calendar.getCalendarEventById(CHARACTER_ID, firstEvent.event_id);
        console.log(`    Date:      ${detail.date}`);
        console.log(`    Duration:  ${detail.duration} minutes`);
        console.log(`    Owner:     ${detail.owner_name} (${detail.owner_type})`);
        console.log(`    Response:  ${detail.response}`);
        console.log(`    Importance: ${detail.importance}`);

        const attendees = await client.calendar.getEventAttendees(CHARACTER_ID, firstEvent.event_id);
        console.log(`    Attendees: ${attendees.length}`);
        for (const a of attendees.slice(0, 5)) {
          console.log(`      Character ${a.character_id}: ${a.event_response}`);
        }
        if (attendees.length > 5) console.log(`      ... and ${attendees.length - 5} more`);
      } catch (err) {
        if (err instanceof EsiError && err.statusCode === 404) {
          console.log('    Event detail not available');
        } else {
          throw err;
        }
      }
    } else {
      console.log('  No upcoming calendar events');
    }

    // --- Character Search ---
    console.log('\nCharacter Search');
    console.log('-'.repeat(50));
    const searchResult = await client.search.characterSearch(
      CHARACTER_ID,
      'Chribba',
      ['character'],
    );
    const charResults = (searchResult as Record<string, number[]>).character || [];
    console.log(`  Search for "Chribba": ${charResults.length} result(s)`);
    for (const id of charResults.slice(0, 5)) {
      console.log(`    Character ID: ${id}`);
    }

  } catch (err) {
    if (err instanceof EsiError && (err.statusCode === 401 || err.statusCode === 403)) {
      console.error('Authentication required. Set ESI_ACCESS_TOKEN.');
    } else {
      console.error('Error:', err instanceof Error ? err.message : err);
    }
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
