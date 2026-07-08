/**
 * ESI.ts Example: Remaining Endpoint Coverage
 *
 * Tests the 16 endpoints not covered by other examples:
 *   - 10 fleet write operations
 *   - 3 asset POST endpoints
 *   - 1 calendar PUT (respond to event)
 *   - 1 CSPA charge cost POST
 *   - 1 dogma dynamic item GET
 *
 * REQUIRES AUTHENTICATION and being in-game in a fleet as fleet commander.
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

const CHARACTER_ID = 90439768;
const CORP_ID = 98135622;

async function tryEndpoint(
  label: string,
  fn: () => Promise<unknown>,
): Promise<{ label: string; status: string; detail: string }> {
  try {
    const result = await fn();
    const detail =
      result === undefined || result === null
        ? 'OK (no content)'
        : typeof result === 'object'
          ? JSON.stringify(result).slice(0, 120)
          : String(result);
    return { label, status: 'PASS', detail };
  } catch (err) {
    if (err instanceof EsiError) {
      return {
        label,
        status: err.statusCode === 404 ? 'PASS (404)' : `FAIL (${err.statusCode})`,
        detail: err.message.slice(0, 100),
      };
    }
    return {
      label,
      status: 'FAIL',
      detail: err instanceof Error ? err.message.slice(0, 100) : String(err),
    };
  }
}

async function main() {
  const client = new EsiClient();
  const results: { label: string; status: string; detail: string }[] = [];

  console.log('Remaining Endpoint Coverage Test\n');
  console.log('='.repeat(60));

  // --- 1. Dogma Dynamic Item (public, no auth) ---
  console.log('\n1. Dogma Dynamic Item');
  console.log('-'.repeat(40));
  results.push(
    await tryEndpoint('GET dogma/dynamic/items/{typeId}/{itemId}', async () => {
      return await client.dogma.getDynamicItemInfo(47789, 1049829575325);
    }),
  );

  // --- 2. CSPA Charge Cost ---
  console.log('\n2. CSPA Charge Cost');
  console.log('-'.repeat(40));
  results.push(
    await tryEndpoint('POST characters/{id}/cspa/', async () => {
      return await client.characters.postCspaChargeCost(CHARACTER_ID, [
        90404873,
      ]);
    }),
  );

  // --- 3. Asset Location & Name POSTs ---
  console.log('\n3. Asset POST Endpoints');
  console.log('-'.repeat(40));

  // Get an asset item ID first
  let assetItemId: number | undefined;
  try {
    const assets = await client.assets.getCharacterAssets(CHARACTER_ID);
    if (assets.length > 0) {
      assetItemId = assets[0]!.item_id;
    }
  } catch {
    // ignore
  }

  if (assetItemId) {
    results.push(
      await tryEndpoint(
        'POST characters/{id}/assets/locations/',
        async () => {
          return await client.assets.postCharacterAssetLocations(
            CHARACTER_ID,
            [assetItemId!],
          );
        },
      ),
    );
  } else {
    results.push({
      label: 'POST characters/{id}/assets/locations/',
      status: 'SKIP',
      detail: 'No assets found',
    });
  }

  results.push(
    await tryEndpoint(
      'POST corporations/{id}/assets/locations/',
      async () => {
        return await client.assets.postCorporationAssetLocations(CORP_ID, [1]);
      },
    ),
  );

  results.push(
    await tryEndpoint(
      'POST corporations/{id}/assets/names/',
      async () => {
        return await client.assets.postCorporationAssetNames(CORP_ID, [1]);
      },
    ),
  );

  // --- 4. Calendar: Respond to Event ---
  console.log('\n4. Calendar Respond');
  console.log('-'.repeat(40));
  // Event 3267240 exists from earlier calendar-search run
  results.push(
    await tryEndpoint(
      'PUT characters/{id}/calendar/{eventId}/',
      async () => {
        return await client.calendar.respondToCalendarEvent(
          CHARACTER_ID,
          3267240,
          'accepted',
        );
      },
    ),
  );

  // --- 5. Fleet Write Operations ---
  console.log('\n5. Fleet Write Operations');
  console.log('-'.repeat(40));

  let fleetId: number | undefined;
  let wingId: number | undefined;
  let squadId: number | undefined;

  // Get fleet info
  try {
    const fleetInfo =
      await client.fleets.getCharacterFleetInfo(CHARACTER_ID);
    fleetId = fleetInfo.fleet_id;
    console.log(`  Fleet ID: ${fleetId}`);
  } catch (err) {
    console.log('  Not in a fleet — skipping fleet write tests');
  }

  if (fleetId) {
    // 5a. Update fleet MOTD
    results.push(
      await tryEndpoint('PUT fleets/{fleetId} (updateFleet)', async () => {
        return await client.fleets.updateFleet(fleetId!, {
          motd: 'ESI.ts coverage test',
          is_free_move: false,
        });
      }),
    );

    // 5b. Create a wing
    let newWingId: number | undefined;
    results.push(
      await tryEndpoint(
        'POST fleets/{fleetId}/wings/ (createFleetWing)',
        async () => {
          const result = await client.fleets.createFleetWing(fleetId!, {});
          newWingId = result.wing_id;
          return result;
        },
      ),
    );

    if (newWingId) {
      wingId = newWingId;

      // 5c. Rename wing
      results.push(
        await tryEndpoint(
          'PUT fleets/{fleetId}/wings/{wingId}/ (renameFleetWing)',
          async () => {
            return await client.fleets.renameFleetWing(
              fleetId!,
              wingId!,
              'Test Wing',
            );
          },
        ),
      );

      // 5d. Create a squad in the new wing
      let newSquadId: number | undefined;
      results.push(
        await tryEndpoint(
          'POST fleets/{fleetId}/wings/{wingId}/squads/ (createFleetSquad)',
          async () => {
            const result = await client.fleets.createFleetSquad(
              fleetId!,
              wingId!,
            );
            newSquadId = result.squad_id;
            return result;
          },
        ),
      );

      if (newSquadId) {
        squadId = newSquadId;

        // 5e. Rename squad
        results.push(
          await tryEndpoint(
            'PUT fleets/{fleetId}/squads/{squadId}/ (renameFleetSquad)',
            async () => {
              return await client.fleets.renameFleetSquad(
                fleetId!,
                squadId!,
                'Test Squad',
              );
            },
          ),
        );

        // 5f. Delete squad
        results.push(
          await tryEndpoint(
            'DELETE fleets/{fleetId}/squads/{squadId}/ (deleteFleetSquad)',
            async () => {
              return await client.fleets.deleteFleetSquad(fleetId!, squadId!);
            },
          ),
        );
      }

      // 5g. Delete wing
      results.push(
        await tryEndpoint(
          'DELETE fleets/{fleetId}/wings/{wingId}/ (deleteFleetWing)',
          async () => {
            return await client.fleets.deleteFleetWing(fleetId!, wingId!);
          },
        ),
      );
    }

    // 5h. Move fleet member (move self to a different squad — may 404)
    const wings = await client.fleets.getFleetWings(fleetId);
    const existingSquad = wings[0]?.squads?.[0];
    if (existingSquad) {
      results.push(
        await tryEndpoint(
          'PUT fleets/{fleetId}/members/{memberId}/ (moveFleetMember)',
          async () => {
            return await client.fleets.moveFleetMember(
              fleetId!,
              CHARACTER_ID,
              {
                role: 'squad_commander',
                wing_id: wings[0]!.id,
                squad_id: existingSquad.id,
              },
            );
          },
        ),
      );

      // Move back to fleet commander
      await client.fleets
        .moveFleetMember(fleetId, CHARACTER_ID, {
          role: 'fleet_commander',
          wing_id: -1,
          squad_id: -1,
        })
        .catch(() => {});
    }

    // 5i. Create fleet invitation (invite a character — will fail if not online, that's OK)
    results.push(
      await tryEndpoint(
        'POST fleets/{fleetId}/members/ (createFleetInvitation)',
        async () => {
          return await client.fleets.createFleetInvitation(fleetId!, {
            character_id: 90404873,
            role: 'squad_member',
          });
        },
      ),
    );

    // 5j. Kick fleet member (kick the invite target if they joined, otherwise expect 404)
    results.push(
      await tryEndpoint(
        'DELETE fleets/{fleetId}/members/{memberId}/ (kickFleetMember)',
        async () => {
          return await client.fleets.kickFleetMember(fleetId!, 90404873);
        },
      ),
    );

    // Restore MOTD
    await client.fleets
      .updateFleet(fleetId, { motd: '', is_free_move: false })
      .catch(() => {});
  }

  // --- Summary ---
  console.log('\n' + '='.repeat(60));
  console.log('RESULTS\n');
  const maxLabel = Math.max(...results.map((r) => r.label.length));
  for (const r of results) {
    const pad = r.label.padEnd(maxLabel + 2);
    console.log(`  ${pad} ${r.status.padEnd(12)} ${r.detail}`);
  }

  const passed = results.filter((r) => r.status.startsWith('PASS')).length;
  const failed = results.filter((r) => r.status.startsWith('FAIL')).length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;
  console.log(
    `\n${passed} passed, ${failed} failed, ${skipped} skipped out of ${results.length} endpoints`,
  );

  await client.shutdown();
}

main();
