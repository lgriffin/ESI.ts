import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

// The foreign-key lookups of features 0014 to 0016: the phrase names the
// parent, the number is its ID.
When(
  /^I look up (NPC corporations of faction|NPC stations in system|NPC stations owned by|NPC characters of corporation|agents in space in system|skin licenses of skin|secondary suns in system) (\d+)$/,
  function (relation: string, id: string) {
    const p = sdeProvider(this);
    const lookups: Record<string, (id: number) => unknown[]> = {
      'NPC corporations of faction': (id) => p.getNpcCorporationsByFaction(id),
      'NPC stations in system': (id) => p.getNpcStationsBySystem(id),
      'NPC stations owned by': (id) => p.getNpcStationsByOwner(id),
      'NPC characters of corporation': (id) =>
        p.getNpcCharactersByCorporation(id),
      'agents in space in system': (id) => p.getAgentsInSpaceBySystem(id),
      'skin licenses of skin': (id) => p.getSkinLicensesBySkin(id),
      'secondary suns in system': (id) => p.getSecondarySunsBySystem(id),
    };
    this.result = lookups[relation]!(Number(id));
  },
);
