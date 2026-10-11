import { z } from 'zod';
import { esiEnum } from './esiEnum';

/** One entry in `GET /corporations/{corporation_id}/structures/sovereignty-hubs`. */
export const SovereigntyHubSchema = z.looseObject({
  id: z.number(),
  solar_system_id: z.number(),
});

/** `GET /corporations/{corporation_id}/structures/sovereignty-hubs`: ESI wraps the list in `sovereignty_hubs`. */
export const SovereigntyHubsResponseSchema = z.looseObject({
  sovereignty_hubs: z.array(SovereigntyHubSchema),
});

/** One entry in `GET /corporations/{corporation_id}/structures/skyhooks`. */
export const OrbitalSkyhookSchema = z.looseObject({
  id: z.number(),
  planet_id: z.number(),
});

/** `GET /corporations/{corporation_id}/structures/skyhooks`: ESI wraps the list in `skyhooks`. */
export const OrbitalSkyhooksResponseSchema = z.looseObject({
  skyhooks: z.array(OrbitalSkyhookSchema),
});

/** One skyhook in `GET /skyhooks/raidable`, and its theft window. */
export const RaidableSkyhookSchema = z.looseObject({
  planet_id: z.number(),
  solar_system_id: z.number(),
  theft_vulnerability: z.looseObject({
    start: z.string(),
    end: z.string(),
  }),
});

/** `GET /skyhooks/raidable`: ESI wraps the list in `skyhooks`. */
export const RaidableSkyhooksResponseSchema = z.looseObject({
  skyhooks: z.array(RaidableSkyhookSchema),
});

export const SkyhookDetailReagentSchema = z.looseObject({
  type_id: z.number(),
  secured_stock: z.number(),
  unsecured_stock: z.number(),
  last_cycle: z.string(),
});

export const SkyhookDetailReinforcementTimerSchema = z.looseObject({
  end: z.string(),
});

export const SkyhookDetailTheftVulnerabilitySchema = z.looseObject({
  start: z.string(),
  end: z.string(),
});

export const SkyhookDetailSchema = z.looseObject({
  id: z.number(),
  planet_id: z.number(),
  state: esiEnum([
    'Unspecified',
    'ShieldVulnerable',
    'ArmorReinforced',
    'ArmorVulnerable',
    'HullReinforced',
    'HullVulnerable',
  ]),
  is_active: z.boolean(),
  effective_workforce: z.number().optional(),
  reagents: z.array(SkyhookDetailReagentSchema).optional(),
  reinforcement_timer: SkyhookDetailReinforcementTimerSchema.optional(),
  theft_vulnerability: SkyhookDetailTheftVulnerabilitySchema.optional(),
});

export const SovereigntyHubDetailReagentSchema = z.looseObject({
  type_id: z.number(),
  amount: z.number(),
  burning_per_hour: z.number(),
});

export const SovereigntyHubDetailReagentBaySchema = z.looseObject({
  last_updated: z.string(),
  reagents: z.array(SovereigntyHubDetailReagentSchema),
});

export const SovereigntyHubDetailResourceSchema = z.looseObject({
  available: z.number(),
  allocated: z.number(),
});

export const SovereigntyHubDetailResourcesSchema = z.looseObject({
  power: SovereigntyHubDetailResourceSchema,
  workforce: SovereigntyHubDetailResourceSchema,
});

export const SovereigntyHubDetailUpgradeSchema = z.looseObject({
  type_id: z.number(),
  power_state: esiEnum(['Unspecified', 'Online', 'Offline', 'Low', 'Pending']),
});

export const SovereigntyHubDetailVulnerabilityWindowSchema = z.looseObject({
  start: z.string(),
  end: z.string(),
});

/**
 * Workforce transport. `configuration` and `state` are each one of `import`,
 * `export` or `transit` (a `oneOf` in the spec), kept free-form.
 */
export const SovereigntyHubDetailTransportSchema = z.looseObject({
  configuration: z.looseObject({}),
  state: z.looseObject({}),
});

export const SovereigntyHubDetailSchema = z.looseObject({
  id: z.number(),
  solar_system_id: z.number(),
  upgrades: z.array(SovereigntyHubDetailUpgradeSchema),
  reagent_bay: SovereigntyHubDetailReagentBaySchema,
  resources: SovereigntyHubDetailResourcesSchema,
  workforce_transport: SovereigntyHubDetailTransportSchema,
  fuel_access_list_id: z.number().optional(),
  vulnerability_window:
    SovereigntyHubDetailVulnerabilityWindowSchema.optional(),
});
