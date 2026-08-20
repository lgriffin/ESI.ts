import { z } from 'zod';
import { esiEnum } from './esiEnum';

export const SovereigntyHubSchema = z.looseObject({
  structure_id: z.number(),
  system_id: z.number(),
  corporation_id: z.number(),
  alliance_id: z.number().optional(),
  online: z.boolean(),
  remaining_reagents: z.number().optional(),
  installed_upgrades: z.array(z.number()).optional(),
});

export const OrbitalSkyhookSchema = z.looseObject({
  structure_id: z.number(),
  system_id: z.number(),
  corporation_id: z.number(),
  alliance_id: z.number().optional(),
  online: z.boolean(),
  reagent_silo_capacity: z.number().optional(),
  reagent_silo_level: z.number().optional(),
});

export const RaidableSkyhookSchema = z.looseObject({
  structure_id: z.number(),
  system_id: z.number(),
  corporation_id: z.number(),
  alliance_id: z.number().optional(),
  raidable_at: z.string().optional(),
  is_raidable: z.boolean(),
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
  burning_per_hour: z.number().optional(),
});

export const SovereigntyHubDetailReagentBaySchema = z.looseObject({
  last_updated: z.string(),
  reagents: z.array(SovereigntyHubDetailReagentSchema),
});

export const SovereigntyHubDetailResourceSchema = z.looseObject({
  available: z.number().optional(),
  used: z.number().optional(),
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

export const SovereigntyHubDetailTransportSchema = z.looseObject({});

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
