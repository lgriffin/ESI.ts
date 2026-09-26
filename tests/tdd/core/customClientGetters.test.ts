import { ApiClientType, CustomEsiClient } from '../../../src/EsiClientBuilder';
import { createClientInstance } from '../../../src/core/ClientRegistry';

// Fails to compile when a registered client type has no getter (#267).
type MissingGetters = Exclude<ApiClientType, keyof CustomEsiClient>;
const everyTypeHasAGetter: [MissingGetters] extends [never] ? true : never =
  true;

// Fails to compile when ApiClientType gains or loses a member.
const ALL_TYPES: Record<ApiClientType, true> = {
  alliance: true,
  assets: true,
  calendar: true,
  characters: true,
  clones: true,
  contacts: true,
  contracts: true,
  corporations: true,
  corporationProjects: true,
  dogma: true,
  factions: true,
  fittings: true,
  fleets: true,
  incursions: true,
  industry: true,
  insurance: true,
  killmails: true,
  location: true,
  loyalty: true,
  mail: true,
  market: true,
  pi: true,
  route: true,
  search: true,
  skills: true,
  sovereignty: true,
  status: true,
  ui: true,
  universe: true,
  wallet: true,
  wars: true,
  meta: true,
  freelanceJobs: true,
  skyhooks: true,
  cosmetics: true,
  paragonHub: true,
  mercenary: true,
  militaryCampaigns: true,
  accessLists: true,
};
const types = Object.keys(ALL_TYPES) as ApiClientType[];

describe('CustomEsiClient getters', () => {
  it('has a getter for every registered client type', () => {
    expect(everyTypeHasAGetter).toBe(true);
  });

  it.each(types)(
    '%s returns the enabled client of the registered class',
    (type) => {
      const client = new CustomEsiClient({ clients: [type] });
      try {
        const viaGetter = (client as unknown as Record<string, unknown>)[type];
        const registered = createClientInstance(
          type,
          // Any ApiClient will do: only the class is compared.
          (client as unknown as { apiClient: never }).apiClient,
        );
        expect(viaGetter).toBe(client.getClient(type));
        expect(viaGetter).toBeInstanceOf(registered.constructor);
      } finally {
        client.shutdown();
      }
    },
  );

  it.each(types)('%s is undefined when the client is not enabled', (type) => {
    const other: ApiClientType = type === 'status' ? 'alliance' : 'status';
    const client = new CustomEsiClient({ clients: [other] });
    try {
      expect(
        (client as unknown as Record<string, unknown>)[type],
      ).toBeUndefined();
    } finally {
      client.shutdown();
    }
  });
});
