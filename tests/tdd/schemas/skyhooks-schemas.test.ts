/**
 * The skyhook and sovereignty hub detail schemas of `./schemas`: each accepts
 * a valid body, rejects a wrong type and keeps an unknown field
 * (z.looseObject).
 */
import { z } from 'zod';
import {
  SkyhookDetailReagentSchema,
  SkyhookDetailReinforcementTimerSchema,
  SkyhookDetailSchema,
  SkyhookDetailTheftVulnerabilitySchema,
  SovereigntyHubDetailReagentBaySchema,
  SovereigntyHubDetailReagentSchema,
  SovereigntyHubDetailResourceSchema,
  SovereigntyHubDetailResourcesSchema,
  SovereigntyHubDetailSchema,
  SovereigntyHubDetailTransportSchema,
  SovereigntyHubDetailUpgradeSchema,
  SovereigntyHubDetailVulnerabilityWindowSchema,
} from '../../../src/schemas';

interface SchemaTestCase {
  name: string;
  schema: z.ZodType;
  validData: Record<string, unknown>;
  invalidData: Record<string, unknown>;
}

const skyhookReagent = {
  type_id: 81143,
  secured_stock: 1200,
  unsecured_stock: 300,
  last_cycle: '2026-11-12T06:00:00Z',
};
const timeWindow = {
  start: '2026-11-12T18:00:00Z',
  end: '2026-11-12T21:00:00Z',
};
const skyhook = {
  id: 1047000001,
  planet_id: 40009081,
  state: 'ShieldVulnerable',
  is_active: true,
  effective_workforce: 5000,
  reagents: [skyhookReagent],
  reinforcement_timer: { end: '2026-11-13T18:00:00Z' },
  theft_vulnerability: timeWindow,
};

const hubReagent = { type_id: 81143, amount: 9000, burning_per_hour: 12 };
const reagentBay = {
  last_updated: '2026-11-12T06:00:00Z',
  reagents: [hubReagent],
};
const resource = { available: 1000, allocated: 600 };
const resources = { power: resource, workforce: resource };
const upgrade = { type_id: 81615, power_state: 'Online' };
const transport = {
  configuration: { export: { amount: 2000, destination_system_id: 30000142 } },
  state: { export: { amount: 2000 } },
};
const hub = {
  id: 1049000001,
  solar_system_id: 30000142,
  upgrades: [upgrade],
  reagent_bay: reagentBay,
  resources,
  workforce_transport: transport,
  fuel_access_list_id: 7,
  vulnerability_window: timeWindow,
};

const schemaCases: SchemaTestCase[] = [
  {
    name: 'SkyhookDetailReagentSchema',
    schema: SkyhookDetailReagentSchema,
    validData: skyhookReagent,
    invalidData: { ...skyhookReagent, secured_stock: '1200' },
  },
  {
    name: 'SkyhookDetailReinforcementTimerSchema',
    schema: SkyhookDetailReinforcementTimerSchema,
    validData: { end: '2026-11-13T18:00:00Z' },
    invalidData: { end: false },
  },
  {
    name: 'SkyhookDetailTheftVulnerabilitySchema',
    schema: SkyhookDetailTheftVulnerabilitySchema,
    validData: timeWindow,
    invalidData: { ...timeWindow, start: 0 },
  },
  {
    name: 'SkyhookDetailSchema',
    schema: SkyhookDetailSchema,
    validData: skyhook,
    invalidData: { ...skyhook, is_active: 'true' },
  },
  {
    name: 'SovereigntyHubDetailReagentSchema',
    schema: SovereigntyHubDetailReagentSchema,
    validData: hubReagent,
    invalidData: { ...hubReagent, burning_per_hour: '12' },
  },
  {
    name: 'SovereigntyHubDetailReagentBaySchema',
    schema: SovereigntyHubDetailReagentBaySchema,
    validData: reagentBay,
    invalidData: { ...reagentBay, reagents: hubReagent },
  },
  {
    name: 'SovereigntyHubDetailResourceSchema',
    schema: SovereigntyHubDetailResourceSchema,
    validData: resource,
    invalidData: { ...resource, allocated: '600' },
  },
  {
    name: 'SovereigntyHubDetailResourcesSchema',
    schema: SovereigntyHubDetailResourcesSchema,
    validData: resources,
    invalidData: { ...resources, power: 1000 },
  },
  {
    name: 'SovereigntyHubDetailUpgradeSchema',
    schema: SovereigntyHubDetailUpgradeSchema,
    validData: upgrade,
    invalidData: { ...upgrade, type_id: '81615' },
  },
  {
    name: 'SovereigntyHubDetailVulnerabilityWindowSchema',
    schema: SovereigntyHubDetailVulnerabilityWindowSchema,
    validData: timeWindow,
    invalidData: { ...timeWindow, end: null },
  },
  {
    name: 'SovereigntyHubDetailTransportSchema',
    schema: SovereigntyHubDetailTransportSchema,
    validData: transport,
    invalidData: { ...transport, state: 'transit' },
  },
  {
    name: 'SovereigntyHubDetailSchema',
    schema: SovereigntyHubDetailSchema,
    validData: hub,
    invalidData: { ...hub, solar_system_id: '30000142' },
  },
];

describe('skyhook and sovereignty hub detail schemas', () => {
  describe.each(schemaCases)('$name', ({ schema, validData, invalidData }) => {
    it('accepts a valid body', () => {
      expect(schema.safeParse(validData).success).toBe(true);
    });

    it('rejects a wrong type on a field', () => {
      expect(schema.safeParse(invalidData).success).toBe(false);
    });

    it('keeps an unknown field', () => {
      const result = schema.safeParse({ ...validData, _extra_field: 'kept' });
      expect(result.success).toBe(true);
      expect(
        (result.data as Record<string, unknown> | undefined)?._extra_field,
      ).toBe('kept');
    });
  });
});
