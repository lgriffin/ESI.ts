/**
 * Fields the ESI OpenAPI spec marks required are required in the Zod schema
 * too. A schema that accepts a body without them types the field as
 * optional, which makes every consumer handle a case ESI never produces.
 *
 * Each case removes one required field from an otherwise ESI-shaped body.
 */
import { z } from 'zod';
import {
  CharacterFleetInfoSchema,
  ContractSchema,
  CorporationStarbaseDetailSchema,
  CustomsOfficeSchema,
  PublicContractSchema,
  SolarSystemInfoSchema,
  ServerStatusSchema,
} from '../../../src/schemas';

const serverStatus = {
  players: 23145,
  server_version: '2890432',
  start_time: '2026-09-16T11:02:31Z',
  vip: false,
};

/** A character contract as `GET /characters/{id}/contracts` returns it. */
const characterContract = {
  contract_id: 212345678,
  issuer_id: 90000001,
  issuer_corporation_id: 98000001,
  assignee_id: 0,
  acceptor_id: 0,
  type: 'item_exchange',
  status: 'outstanding',
  availability: 'personal',
  for_corporation: false,
  date_issued: '2026-09-10T12:00:00Z',
  date_expired: '2026-09-24T12:00:00Z',
  price: 150000000,
};

/** A POS configuration as `GET /corporations/{id}/starbases/{id}` returns it. */
const starbaseDetail = {
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
};

/** `GET /characters/{character_id}/fleet`: CharactersCharacterIdFleetGet. */
const characterFleet = {
  fleet_id: 1234567890,
  fleet_boss_id: 90000001,
  role: 'squad_member',
  wing_id: 2073711261968,
  squad_id: 3129411261968,
};

/** `GET /corporations/{id}/customs_offices`: CorporationsCorporationIdCustomsOfficesGet. */
const customsOffice = {
  office_id: 1000000012345,
  system_id: 30000142,
  reinforce_exit_start: 18,
  reinforce_exit_end: 20,
  allow_alliance_access: true,
  allow_access_with_standings: false,
  corporation_tax_rate: 0.05,
};

/** `GET /universe/systems/{system_id}`: UniverseSystemsSystemIdGet. */
const solarSystem = {
  system_id: 30000142,
  name: 'Jita',
  constellation_id: 20000020,
  security_status: 0.9459991455078125,
  position: {
    x: -129064861735000000,
    y: 60755306910000000,
    z: 117469227060000000,
  },
};

function without(body: Record<string, unknown>, field: string) {
  const copy = { ...body };
  delete copy[field];
  return copy;
}

const cases: Array<{
  schema: string;
  zod: z.ZodType;
  body: Record<string, unknown>;
  field: string;
}> = [
  {
    schema: 'ServerStatusSchema',
    zod: ServerStatusSchema,
    body: serverStatus,
    field: 'vip',
  },
  {
    schema: 'ContractSchema',
    zod: ContractSchema,
    body: characterContract,
    field: 'status',
  },
  {
    schema: 'ContractSchema',
    zod: ContractSchema,
    body: characterContract,
    field: 'availability',
  },
  ...(['assignee_id', 'acceptor_id', 'for_corporation'] as const).map(
    (field) => ({
      schema: 'ContractSchema',
      zod: ContractSchema as z.ZodType,
      body: characterContract,
      field,
    }),
  ),
  ...(
    [
      'fuel_bay_view',
      'fuel_bay_take',
      'anchor',
      'unanchor',
      'online',
      'offline',
      'allow_corporation_members',
      'allow_alliance_members',
      'use_alliance_standings',
      'attack_if_other_security_status_dropping',
      'attack_if_at_war',
    ] as const
  ).map((field) => ({
    schema: 'CorporationStarbaseDetailSchema',
    zod: CorporationStarbaseDetailSchema as z.ZodType,
    body: starbaseDetail,
    field,
  })),
  {
    schema: 'CharacterFleetInfoSchema',
    zod: CharacterFleetInfoSchema,
    body: characterFleet,
    field: 'fleet_boss_id',
  },
  ...(['allow_alliance_access', 'allow_access_with_standings'] as const).map(
    (field) => ({
      schema: 'CustomsOfficeSchema',
      zod: CustomsOfficeSchema as z.ZodType,
      body: customsOffice,
      field,
    }),
  ),
  {
    schema: 'SolarSystemInfoSchema',
    zod: SolarSystemInfoSchema,
    body: solarSystem,
    field: 'position',
  },
];

describe('Schemas require the fields ESI marks required', () => {
  it.each(cases)('$schema accepts the complete body', ({ zod, body }) => {
    expect(zod.safeParse(body).success).toBe(true);
  });

  it.each(cases)(
    '$schema rejects a body without $field',
    ({ zod, body, field }) => {
      const result = zod.safeParse(without(body, field));
      expect(result.success).toBe(false);
    },
  );
});

describe('Public contracts follow their own spec shape', () => {
  it('accepts a public contract, which carries no status or availability', () => {
    const publicContract = { ...characterContract } as Record<string, unknown>;
    for (const field of [
      'status',
      'availability',
      'assignee_id',
      'acceptor_id',
    ]) {
      delete publicContract[field];
    }
    expect(PublicContractSchema.safeParse(publicContract).success).toBe(true);
  });
});
