import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';
import {
  RETRYABLE_ATTEMPTS,
  createSeamClient,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature(
  'tests/bdd/features/integration/0001-integration-workflows.feature',
);

const ESI_ORIGIN = 'https://esi.evetech.net';

/**
 * Match exactly one ESI route. Several routes in these workflows are prefixes
 * of each other (`/characters/{id}/` and `/characters/{id}/portrait/`), so a
 * plain substring match would serve the wrong queued response. `page` pins a
 * response to one page of an offset-paginated collection; without it the
 * request must carry no page parameter.
 */
function route(path: string, page?: number): RegExp {
  const escaped = (ESI_ORIGIN + path).replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  const query =
    page === undefined
      ? '(\\?(?![^#]*\\bpage=)[^#]*)?'
      : `\\?([^#]*&)?page=${page}(&[^#]*)?`;
  return new RegExp(`^${escaped}${query}$`);
}

/** The paths the client requested, in the order it sent them. */
function sentPaths(): string[] {
  return sentRequests().map((r) => r.url.pathname);
}

const AUTH_HEADER = 'Bearer bdd-access-token';

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Character profile joins character, corporation, and alliance by identifier', ({
    given,
    when,
    then,
  }) => {
    let character: any;
    let portrait: any;
    let corporation: any;
    let alliance: any;
    let location: any;
    let skills: any;

    const characterId = 1689391488;
    const corporationId = 1344654522;
    const allianceId = 99005338;

    given('a character ID for profile assembly', () => {
      // ESI's detail records do not repeat their own ID: a character carries
      // corporation_id and alliance_id, a corporation carries alliance_id, and
      // an alliance carries executor_corporation_id.
      const characterDetail = TestDataFactory.createCharacterInfo({
        name: 'Test Pilot',
        corporation_id: corporationId,
        alliance_id: allianceId,
      });
      const corporationDetail = TestDataFactory.createCorporationInfo({
        name: 'GoonWaffe',
        alliance_id: allianceId,
      });
      const allianceDetail = TestDataFactory.createAllianceInfo({
        name: 'Goonswarm Federation',
        executor_corporation_id: corporationId,
      });

      queueResponse({
        match: route(`/characters/${characterId}/`),
        body: characterDetail,
      });
      queueResponse({
        match: route(`/characters/${characterId}/portrait/`),
        body: TestDataFactory.createCharacterPortrait(characterId),
      });
      queueResponse({
        match: route(`/corporations/${corporationId}`),
        body: corporationDetail,
      });
      queueResponse({
        match: route(`/alliances/${allianceId}/`),
        body: allianceDetail,
      });
      queueResponse({
        match: route(`/characters/${characterId}/location`),
        body: { solar_system_id: 30000142, station_id: 60003760 },
      });
      queueResponse({
        match: route(`/characters/${characterId}/skills`),
        body: TestDataFactory.createCharacterSkills({ total_sp: 50000000 }),
      });
    });

    when('the client assembles a complete profile', async () => {
      character = await client.characters.getCharacterPublicInfo(characterId);
      [portrait, corporation, alliance, location, skills] = await Promise.all([
        client.characters.getCharacterPortrait(characterId),
        client.corporations.getCorporationInfo(character.corporation_id),
        client.alliance.getAllianceById(character.alliance_id),
        client.location.getCharacterLocation(characterId),
        client.skills.getCharacterSkills(characterId),
      ]);
    });

    then('the client shall gather all related character data', () => {
      // The corporation and alliance lookups were keyed by the IDs the
      // character record carried.
      expect(sentPaths()[0]).toBe(`/characters/${characterId}/`);
      expect(sentPaths().slice(1).sort()).toEqual(
        [
          `/alliances/${allianceId}/`,
          `/characters/${characterId}/location`,
          `/characters/${characterId}/portrait/`,
          `/characters/${characterId}/skills`,
          `/corporations/${corporationId}`,
        ].sort(),
      );

      expect(character.name).toBe('Test Pilot');
      expect(character.corporation_id).toBe(corporationId);
      expect(character.alliance_id).toBe(allianceId);

      expect(corporation.name).toBe('GoonWaffe');
      expect(corporation.alliance_id).toBe(character.alliance_id);
      expect(alliance.name).toBe('Goonswarm Federation');
      expect(alliance.executor_corporation_id).toBe(character.corporation_id);

      expect(portrait.px512x512).toBe(
        `https://images.evetech.net/characters/${characterId}/portrait?size=512`,
      );
      expect(location).toEqual({
        solar_system_id: 30000142,
        station_id: 60003760,
      });
      expect(skills.total_sp).toBe(50000000);
      expect(skills.skills.map((s: any) => s.skill_id)).toEqual([3300, 3301]);
    });
  });

  test('Market analysis derives best bid, best ask, and spread from returned orders', ({
    given,
    when,
    then,
  }) => {
    let prices: any;
    let orders: any;
    let history: any;
    let characterOrders: any;
    let itemType: any;

    const regionId = 10000002;
    const typeId = 34;
    const characterId = 1689391488;

    const order = (order_id: number, is_buy_order: boolean, price: number) =>
      TestDataFactory.createMarketOrder({
        order_id,
        type_id: typeId,
        is_buy_order,
        price,
      });

    given('a trading opportunity exists', () => {
      queueResponse({
        match: route('/markets/prices/'),
        body: [
          TestDataFactory.createMarketPrice({ type_id: 35, average_price: 9 }),
          TestDataFactory.createMarketPrice({
            type_id: typeId,
            average_price: 4.5,
          }),
        ],
      });
      // The region order book spans two pages; the best ask is only on page 2.
      queueResponse({
        match: route(`/markets/${regionId}/orders/`),
        headers: { 'x-pages': '2' },
        body: [
          order(6000000001, true, 4.45),
          order(6000000002, true, 4.4),
          order(6000000003, false, 4.6),
        ],
      });
      queueResponse({
        match: route(`/markets/${regionId}/orders/`, 2),
        headers: { 'x-pages': '2' },
        body: [order(6000000004, false, 4.55), order(6000000005, true, 4.3)],
      });
      queueResponse({
        match: route(`/markets/${regionId}/history/`),
        body: [
          TestDataFactory.createMarketHistory({
            date: '2024-01-14',
            average: 4.4,
            volume: 950000000,
          }),
          TestDataFactory.createMarketHistory({
            date: '2024-01-15',
            average: 4.5,
            volume: 1000000000,
          }),
        ],
      });
      queueResponse({
        match: route(`/characters/${characterId}/orders/`),
        body: [
          TestDataFactory.createCharacterMarketOrder({
            order_id: 5000000001,
            type_id: typeId,
            price: 4.4,
            is_buy_order: true,
          }),
          TestDataFactory.createCharacterMarketOrder({
            order_id: 5000000002,
            type_id: 35,
            price: 8.9,
            is_buy_order: false,
          }),
        ],
      });
      queueResponse({
        match: route(`/universe/types/${typeId}`),
        body: TestDataFactory.createItemType({
          type_id: typeId,
          name: 'Tritanium',
          volume: 0.01,
        }),
      });
    });

    when('the client performs market analysis', async () => {
      [prices, orders, history, characterOrders, itemType] = await Promise.all([
        client.market.getMarketPrices(),
        client.market.getMarketOrders(regionId),
        client.market.getMarketHistory(regionId, typeId),
        client.market.getCharacterOrders(characterId),
        client.universe.getTypeById(typeId),
      ]);
    });

    then('the client shall gather comprehensive market data', () => {
      const historyRequest = sentRequests().find((r) =>
        r.url.pathname.endsWith('/history/'),
      );
      expect(historyRequest?.url.searchParams.get('type_id')).toBe(
        String(typeId),
      );

      expect(orders.map((o: any) => o.order_id)).toEqual([
        6000000001, 6000000002, 6000000003, 6000000004, 6000000005,
      ]);

      const currentPrice = prices.find(
        (p: any) => p.type_id === typeId,
      )?.average_price;
      const bids = orders.filter((o: any) => o.is_buy_order);
      const asks = orders.filter((o: any) => !o.is_buy_order);
      const bestBid = Math.max(...bids.map((o: any) => o.price));
      const bestAsk = Math.min(...asks.map((o: any) => o.price));
      const priceChange =
        history[history.length - 1].average -
        history[history.length - 2].average;
      const myActiveOrders = characterOrders.filter(
        (o: any) => o.type_id === typeId,
      );

      expect(currentPrice).toBe(4.5);
      expect(bestBid).toBe(4.45);
      expect(bestAsk).toBe(4.55);
      expect(bestAsk - bestBid).toBeCloseTo(0.1, 10);
      expect(priceChange).toBeCloseTo(0.1, 10);
      expect(myActiveOrders.map((o: any) => o.order_id)).toEqual([5000000001]);
      expect(itemType.name).toBe('Tritanium');
      expect(itemType.volume).toBe(0.01);
    });
  });

  test('Corporation overview sums wallet balances across two divisions', ({
    given,
    when,
    then,
  }) => {
    let corporation: any;
    let members: any;
    let memberRoles: any;
    let wallets: any;
    let assets: any;

    const corporationId = 1344654522;
    const characterId = 1689391488;
    const memberIds = Array.from({ length: 150 }, (_, i) => characterId + i);

    given('a corporation director role', () => {
      const corporationDetail = TestDataFactory.createCorporationInfo({
        name: 'Test Corporation',
        member_count: 150,
      });

      queueResponse({
        match: route(`/corporations/${corporationId}`),
        body: corporationDetail,
      });
      queueResponse({
        match: route(`/corporations/${corporationId}/members`),
        body: memberIds,
      });
      queueResponse({
        match: route(`/corporations/${corporationId}/roles`),
        body: [
          TestDataFactory.createCorporationMemberRoles({
            character_id: characterId,
            roles: ['Director', 'Personnel_Manager'],
          }),
          TestDataFactory.createCorporationMemberRoles({
            character_id: characterId + 1,
            roles: ['Hangar_Take_1'],
            roles_at_hq: [],
          }),
        ],
      });
      queueResponse({
        match: route(`/corporations/${corporationId}/wallets`),
        body: [
          { division: 1, balance: 5000000000.5 },
          { division: 2, balance: 1000000000.25 },
        ],
      });
      queueResponse({
        match: route(`/corporations/${corporationId}/assets/`),
        body: [
          {
            item_id: 1000000000001,
            type_id: 587,
            quantity: 100,
            location_id: 60003760,
            location_flag: 'CorpSAG1',
            location_type: 'station',
            is_singleton: false,
          },
        ],
      });
    });

    when('the client manages corporation overview', async () => {
      corporation = await client.corporations.getCorporationInfo(corporationId);
      [members, memberRoles, wallets, assets] = await Promise.all([
        client.corporations.getCorporationMembers(corporationId),
        client.corporations.getCorporationRoles(corporationId),
        client.wallet.getCorporationWallets(corporationId),
        client.assets.getCorporationAssets(corporationId),
      ]);
    });

    then('the client shall access all corporation data', () => {
      for (const request of sentRequests().slice(1)) {
        expect(request.headers.authorization).toBe(AUTH_HEADER);
      }

      expect(corporation.name).toBe('Test Corporation');
      expect(corporation.member_count).toBe(150);
      expect(members).toEqual(memberIds);
      expect(members.length).toBe(corporation.member_count);

      const totalWalletBalance = wallets.reduce(
        (total: number, wallet: any) => total + wallet.balance,
        0,
      );
      expect(wallets.map((w: any) => w.division)).toEqual([1, 2]);
      expect(totalWalletBalance).toBe(6000000000.75);

      expect(assets).toHaveLength(1);
      expect(assets[0].location_flag).toBe('CorpSAG1');
      expect(assets[0].quantity).toBe(100);

      const directors = memberRoles
        .filter((member: any) => member.roles?.includes('Director'))
        .map((member: any) => member.character_id);
      expect(directors).toEqual([characterId]);
      expect(members).toContain(directors[0]);
    });
  });

  test('Fleet overview joins the boss, members, and wings of one fleet', ({
    given,
    when,
    then,
  }) => {
    let membership: any;
    let fleet: any;
    let members: any;
    let wings: any;
    let shipTypes: any[];

    const fleetId = 1234567890;
    const characterId = 1689391488;
    const wingId = 987654321;
    const squadId = 123456789;

    given('fleet commander permissions', () => {
      queueResponse({
        match: route(`/characters/${characterId}/fleet`),
        body: {
          fleet_id: fleetId,
          fleet_boss_id: characterId,
          role: 'fleet_commander',
          wing_id: -1,
          squad_id: -1,
        },
      });
      queueResponse({
        match: route(`/fleets/${fleetId}`),
        body: TestDataFactory.createFleetInfo(),
      });
      queueResponse({
        match: route(`/fleets/${fleetId}/members`),
        body: [
          TestDataFactory.createFleetMember({
            character_id: characterId,
            ship_type_id: 17918,
          }),
          TestDataFactory.createFleetMember({
            character_id: 1689391489,
            role: 'squad_member',
            role_name: 'Squad Member',
            ship_type_id: 17812,
            station_id: undefined,
            wing_id: wingId,
            squad_id: squadId,
          }),
        ],
      });
      queueResponse({
        match: route(`/fleets/${fleetId}/wings/`),
        body: [
          TestDataFactory.createFleetWing({
            id: wingId,
            squads: [{ id: squadId, name: 'Squad 1' }],
          }),
        ],
      });
      queueResponse({
        match: route('/universe/types/17918'),
        body: TestDataFactory.createItemType({
          type_id: 17918,
          name: 'Rattlesnake',
          group_id: 27,
        }),
      });
      queueResponse({
        match: route('/universe/types/17812'),
        body: TestDataFactory.createItemType({
          type_id: 17812,
          name: 'Republic Fleet Firetail',
          group_id: 25,
        }),
      });
    });

    when('the client manages fleet operations', async () => {
      membership = await client.fleets.getCharacterFleetInfo(characterId);
      [fleet, members, wings] = await Promise.all([
        client.fleets.getFleetInformation(membership.fleet_id),
        client.fleets.getFleetMembers(membership.fleet_id),
        client.fleets.getFleetWings(membership.fleet_id),
      ]);
      shipTypes = await Promise.all(
        members.map((m: any) => client.universe.getTypeById(m.ship_type_id)),
      );
    });

    then('the client shall coordinate fleet activities', () => {
      // Every fleet route was keyed by the fleet_id from the membership record.
      expect(sentPaths()).toContain(`/fleets/${fleetId}`);
      expect(sentPaths()).toContain(`/fleets/${fleetId}/members`);
      expect(sentPaths()).toContain(`/fleets/${fleetId}/wings/`);

      expect(fleet.motd).toBe('Fleet operations in progress');

      const boss = members.find(
        (m: any) => m.character_id === membership.fleet_boss_id,
      );
      expect(boss?.role).toBe('fleet_commander');

      const squadMembers = members.filter(
        (m: any) => m.role === 'squad_member',
      );
      expect(squadMembers.map((m: any) => m.character_id)).toEqual([
        1689391489,
      ]);
      const wing = wings.find((w: any) => w.id === squadMembers[0].wing_id);
      expect(wing?.name).toBe('Wing 1');
      expect(
        wing?.squads.find((s: any) => s.id === squadMembers[0].squad_id)?.name,
      ).toBe('Squad 1');

      // Ship names resolved through the universe client by ship_type_id.
      expect(
        members.map(
          (m: any, i: number) =>
            `${m.character_id}:${m.ship_type_id}:${shipTypes[i].name}`,
        ),
      ).toEqual([
        `${characterId}:17918:Rattlesnake`,
        '1689391489:17812:Republic Fleet Firetail',
      ]);
      expect(shipTypes.map((t) => t.type_id)).toEqual([17918, 17812]);

      expect(members.map((m: any) => m.solar_system_id)).toEqual([
        30000142, 30000142,
      ]);
    });
  });

  test('Manufacturing setup sums remaining runs across returned blueprints', ({
    given,
    when,
    then,
  }) => {
    let industryJobs: any;
    let blueprints: any;
    let assets: any;

    const characterId = 1689391488;

    const blueprint = (item_id: number, quantity: number, runs: number) =>
      TestDataFactory.createBlueprint({
        item_id,
        type_id: 17919,
        quantity,
        runs,
      });

    given('manufacturing requirements exist', () => {
      queueResponse({
        match: route(`/characters/${characterId}/industry/jobs`),
        body: [
          {
            job_id: 1000001,
            installer_id: characterId,
            facility_id: 60003760,
            station_id: 60003760,
            activity_id: 1,
            blueprint_id: 1000000001,
            blueprint_type_id: 17919,
            blueprint_location_id: 60003760,
            output_location_id: 60003760,
            product_type_id: 17918,
            runs: 1,
            status: 'active',
            duration: 86400,
            start_date: '2024-01-15T12:00:00Z',
            end_date: '2024-01-16T12:00:00Z',
          },
        ],
      });
      // Blueprints span two pages. A copy (quantity -2) has a finite run
      // count; an original (quantity -1) reports runs -1.
      queueResponse({
        match: route(`/characters/${characterId}/blueprints/`),
        headers: { 'x-pages': '2' },
        body: [blueprint(1000000001, -2, 100), blueprint(1000000003, -1, -1)],
      });
      queueResponse({
        match: route(`/characters/${characterId}/blueprints/`, 2),
        headers: { 'x-pages': '2' },
        body: [blueprint(1000000004, -2, 25)],
      });
      queueResponse({
        match: route(`/characters/${characterId}/assets/`),
        body: [
          {
            item_id: 1000000002,
            type_id: 34,
            quantity: 1000000,
            location_id: 60003760,
            location_flag: 'Hangar',
            location_type: 'station',
            is_singleton: false,
          },
        ],
      });
    });

    when('the client sets up production', async () => {
      [industryJobs, blueprints, assets] = await Promise.all([
        client.industry.getCharacterIndustryJobs(characterId),
        client.characters.getCharacterBlueprints(characterId),
        client.assets.getCharacterAssets(characterId),
      ]);
    });

    then('the client shall coordinate all manufacturing aspects', () => {
      expect(blueprints.map((bp: any) => bp.item_id)).toEqual([
        1000000001, 1000000003, 1000000004,
      ]);

      const activeJobs = industryJobs.filter(
        (job: any) => job.status === 'active',
      );
      expect(activeJobs.map((job: any) => job.job_id)).toEqual([1000001]);
      // The active job is running from a blueprint the character holds.
      expect(
        blueprints.some((bp: any) => bp.item_id === activeJobs[0].blueprint_id),
      ).toBe(true);

      const copies = blueprints.filter((bp: any) => bp.runs > 0);
      const totalRuns = copies.reduce(
        (total: number, bp: any) => total + bp.runs,
        0,
      );
      expect(totalRuns).toBe(125);
      expect(blueprints[0].material_efficiency).toBe(10);

      const materials = assets.filter((asset: any) => asset.type_id === 34);
      expect(materials.map((a: any) => a.quantity)).toEqual([1000000]);
    });
  });

  test('Portrait outage leaves the character and corporation lookups fulfilled', ({
    given,
    when,
    then,
  }) => {
    let results: PromiseSettledResult<any>[];

    const characterId = 1689391488;
    const corporationId = 1344654522;

    given('some services are unavailable', () => {
      const characterDetail = TestDataFactory.createCharacterInfo({
        name: 'Test Pilot',
        corporation_id: corporationId,
      });
      const corporationDetail = TestDataFactory.createCorporationInfo({
        name: 'GoonWaffe',
      });

      queueResponse({
        match: route(`/characters/${characterId}/`),
        body: characterDetail,
      });
      // 503 is retryable, so the outage has to outlast the retry budget.
      queueError(503, 'Service Unavailable', {
        match: route(`/characters/${characterId}/portrait/`),
        times: RETRYABLE_ATTEMPTS,
      });
      queueResponse({
        match: route(`/corporations/${corporationId}`),
        body: corporationDetail,
      });
    });

    when(
      'the client performs integration workflow with partial failures',
      async () => {
        results = await Promise.allSettled([
          client.characters.getCharacterPublicInfo(characterId),
          client.characters.getCharacterPortrait(characterId),
          client.corporations.getCorporationInfo(corporationId),
        ]);
      },
    );

    then('the client shall handle partial failures gracefully', () => {
      expect(results.map((r) => r.status)).toEqual([
        'fulfilled',
        'rejected',
        'fulfilled',
      ]);

      const [character, portrait, corporation] = results;
      expect((character as PromiseFulfilledResult<any>).value.name).toBe(
        'Test Pilot',
      );
      expect(
        (character as PromiseFulfilledResult<any>).value.corporation_id,
      ).toBe(corporationId);
      expect((corporation as PromiseFulfilledResult<any>).value.name).toBe(
        'GoonWaffe',
      );

      const reason = (portrait as PromiseRejectedResult).reason;
      expect(reason).toBeInstanceOf(EsiError);
      expect((reason as EsiError).statusCode).toBe(503);
      expect(sentPaths().filter((p) => p.endsWith('/portrait/')).length).toBe(
        RETRYABLE_ATTEMPTS,
      );
    });
  });

  test('Profile fan-out behind the initial character lookup', ({
    given,
    when,
    then,
  }) => {
    let character: any;
    let portrait: any;
    let corporation: any;
    let alliance: any;
    let location: any;
    let skills: any;
    let totalTime: number;

    const characterId = 1689391488;
    const corporationId = 1344654522;
    const allianceId = 99005338;

    given('a complex data requirement', () => {
      const characterDetail = TestDataFactory.createCharacterInfo({
        corporation_id: corporationId,
        alliance_id: allianceId,
      });
      const corporationDetail = TestDataFactory.createCorporationInfo({
        name: 'GoonWaffe',
      });
      const allianceDetail = TestDataFactory.createAllianceInfo({
        name: 'Goonswarm Federation',
      });

      queueResponse({
        match: route(`/characters/${characterId}/`),
        body: characterDetail,
        delayMs: 100,
      });
      queueResponse({
        match: route(`/characters/${characterId}/portrait/`),
        body: TestDataFactory.createCharacterPortrait(characterId),
        delayMs: 50,
      });
      queueResponse({
        match: route(`/corporations/${corporationId}`),
        body: corporationDetail,
        delayMs: 80,
      });
      queueResponse({
        match: route(`/alliances/${allianceId}/`),
        body: allianceDetail,
        delayMs: 60,
      });
      queueResponse({
        match: route(`/characters/${characterId}/location`),
        body: { solar_system_id: 30000142 },
        delayMs: 40,
      });
      queueResponse({
        match: route(`/characters/${characterId}/skills`),
        body: TestDataFactory.createCharacterSkills({ total_sp: 50000000 }),
        delayMs: 90,
      });
    });

    when('the client optimizes data gathering', async () => {
      const startTime = Date.now();

      character = await client.characters.getCharacterPublicInfo(characterId);

      [portrait, corporation, alliance, location, skills] = await Promise.all([
        client.characters.getCharacterPortrait(characterId),
        client.corporations.getCorporationInfo(character.corporation_id),
        client.alliance.getAllianceById(character.alliance_id),
        client.location.getCharacterLocation(characterId),
        client.skills.getCharacterSkills(characterId),
      ]);

      totalTime = Date.now() - startTime;
    });

    then('the client shall minimize API calls and response time', () => {
      expect(sentRequests()).toHaveLength(6);
      expect(sentPaths()).toContain(`/corporations/${corporationId}`);
      expect(sentPaths()).toContain(`/alliances/${allianceId}/`);

      expect(character.corporation_id).toBe(corporationId);
      expect(portrait.px512x512).toBe(
        `https://images.evetech.net/characters/${characterId}/portrait?size=512`,
      );
      expect(corporation.name).toBe('GoonWaffe');
      expect(alliance.name).toBe('Goonswarm Federation');
      expect(location.solar_system_id).toBe(30000142);
      expect(skills.total_sp).toBe(50000000);

      // The six legs sum to 420 ms, so run one after another the workflow
      // cannot settle sooner (less a few milliseconds of early timers); run in
      // parallel behind the first lookup it settles near 200.
      expect(totalTime).toBeLessThan(400);
    });
  });
});
