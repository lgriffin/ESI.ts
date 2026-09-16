/**
 * Response bodies shaped exactly as the ESI OpenAPI spec defines them
 * (compatibility_date 2025-12-16) pass the Zod schema the client validates
 * that route with. A schema that requires a field the spec does not define,
 * or expects a different shape, throws EsiValidationError on every real
 * response.
 *
 * Each body carries only what the spec defines for the route, with the
 * optional fields ESI sends in practice.
 */
import { z } from 'zod';
import { contractEndpoints } from '../../../src/core/endpoints/contractEndpoints';
import { corporationEndpoints } from '../../../src/core/endpoints/corporationEndpoints';
import { freelanceJobsEndpoints } from '../../../src/core/endpoints/freelanceJobsEndpoints';

interface BodyCase {
  route: string;
  schema: z.ZodType;
  body: unknown;
}

const cases: BodyCase[] = [
  {
    // ContractsPublicBidsContractIdGet: no bidder_id on a public bid.
    route: 'GET /contracts/public/bids/{contract_id}',
    schema: contractEndpoints.getPublicContractBids.responseSchema,
    body: [{ bid_id: 1, date_bid: '2026-09-15T10:00:00Z', amount: 12000000 }],
  },
  {
    // ContractsPublicItemsContractIdGet: no is_singleton or raw_quantity; a
    // blueprint line carries item_id, efficiency and runs.
    route: 'GET /contracts/public/items/{contract_id}',
    schema: contractEndpoints.getPublicContractItems.responseSchema,
    body: [
      { record_id: 1, type_id: 34, quantity: 1000000, is_included: true },
      {
        record_id: 2,
        type_id: 691,
        quantity: 1,
        is_included: true,
        item_id: 1040011111111,
        is_blueprint_copy: true,
        material_efficiency: 10,
        time_efficiency: 20,
        runs: 5,
      },
    ],
  },
  {
    // FreelanceJobsListing: Cursor tokens are optional strings, never null.
    route: 'GET /freelance-jobs',
    schema: freelanceJobsEndpoints.getFreelanceJobs.responseSchema,
    body: {
      cursor: { after: 'bdd-freelance-page-2-cursor' },
      freelance_jobs: [
        {
          id: '3868eaed-8278-4cb7-9709-7d7de9c20dc7',
          name: 'Shield boosting for the home fleet',
          state: 'Active',
          last_modified: '2026-09-15T10:00:00Z',
          progress: { current: 50, desired: 100 },
        },
      ],
    },
  },
  {
    // FreelanceJobsDetail: contribution, details.expires and
    // access_and_visibility.broadcast_locations are optional.
    route: 'GET /freelance-jobs/{job_id}',
    schema: freelanceJobsEndpoints.getFreelanceJobById.responseSchema,
    body: {
      id: '3868eaed-8278-4cb7-9709-7d7de9c20dc7',
      name: 'Shield boosting for the home fleet',
      state: 'Completed',
      last_modified: '2026-09-15T10:00:00Z',
      progress: { current: 100, desired: 100 },
      details: {
        description: 'Boost shields on the staging keepstar',
        career: 'Enforcer',
        created: '2026-09-01T00:00:00Z',
        finished: '2026-09-15T10:00:00Z',
        creator: {
          character: { id: 90000001, name: 'Creator Name' },
          corporation: { id: 98777771, name: 'Creator Corporation' },
        },
      },
      configuration: {
        version: 1,
        method: 'BoostShield',
        parameters: {},
      },
      access_and_visibility: { acl_protected: false },
    },
  },
  {
    // CharactersFreelanceJobsParticipation.
    route:
      'GET /characters/{character_id}/freelance-jobs/{job_id}/participation',
    schema:
      freelanceJobsEndpoints.getCharacterFreelanceJobParticipation
        .responseSchema,
    body: {
      state: 'Committed',
      contributed: 100,
      last_modified: '2026-09-15T10:00:00Z',
    },
  },
  {
    // CorporationsFreelanceJobsParticipants: an object page, not an array.
    route:
      'GET /corporations/{corporation_id}/freelance-jobs/{job_id}/participants',
    schema:
      freelanceJobsEndpoints.getCorporationFreelanceJobParticipants
        .responseSchema,
    body: {
      participants: [
        {
          id: 90000001,
          name: 'Participant Name',
          state: 'Committed',
          contributed: 100,
        },
      ],
    },
  },
  {
    // CorporationsCorporationIdMedalsGet: created_at, not date.
    route: 'GET /corporations/{corporation_id}/medals',
    schema: corporationEndpoints.getCorporationMedals.responseSchema,
    body: [
      {
        medal_id: 1,
        title: 'Defender of the Keepstar',
        description: 'Held the line',
        creator_id: 90000001,
        created_at: '2026-01-15T00:00:00Z',
      },
    ],
  },
  {
    // CorporationsCorporationIdMedalsIssuedGet: no title or description.
    route: 'GET /corporations/{corporation_id}/medals/issued',
    schema: corporationEndpoints.getCorporationIssuedMedals.responseSchema,
    body: [
      {
        medal_id: 1,
        character_id: 90000002,
        issuer_id: 90000001,
        issued_at: '2026-02-01T00:00:00Z',
        reason: 'Held the line',
        status: 'public',
      },
    ],
  },
  {
    // CorporationsCorporationIdRolesHistoryGet: old_roles and new_roles.
    route: 'GET /corporations/{corporation_id}/roles/history',
    schema:
      corporationEndpoints.getCorporationMemberRolesHistory.responseSchema,
    body: [
      {
        character_id: 90000002,
        changed_at: '2026-03-01T00:00:00Z',
        issuer_id: 90000001,
        role_type: 'roles',
        old_roles: ['Hangar_Take_1'],
        new_roles: ['Hangar_Take_1', 'Station_Manager'],
      },
    ],
  },
  {
    // CorporationsCorporationIdStarbasesStarbaseIdGet: no state.
    route: 'GET /corporations/{corporation_id}/starbases/{starbase_id}',
    schema: corporationEndpoints.getCorporationStarbaseDetail.responseSchema,
    body: {
      fuel_bay_view: 'starbase_fuel_technician_role',
      fuel_bay_take: 'config_starbase_equipment_role',
      anchor: 'config_starbase_equipment_role',
      unanchor: 'config_starbase_equipment_role',
      online: 'config_starbase_equipment_role',
      offline: 'config_starbase_equipment_role',
      allow_corporation_members: true,
      allow_alliance_members: false,
      use_alliance_standings: true,
      attack_if_other_security_status_dropping: false,
      attack_if_at_war: true,
      fuels: [{ type_id: 4051, quantity: 960 }],
    },
  },
];

describe('Schemas accept response bodies shaped as the ESI spec defines', () => {
  it.each(cases)('$route', ({ schema, body }) => {
    const result = schema.safeParse(body);
    expect(result.success ? [] : result.error.issues).toEqual([]);
  });
});
