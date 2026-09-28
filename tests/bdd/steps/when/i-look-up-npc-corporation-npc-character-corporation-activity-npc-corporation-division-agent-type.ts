import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

// The NPC organisation tables (0014), one lookup per noun.
When(
  /^I look up (NPC corporation|NPC character|corporation activity|NPC corporation division|agent type|agent in space) (\d+)$/,
  function (noun: string, id: string) {
    const p = sdeProvider(this);
    const lookups: Record<string, (id: number) => unknown> = {
      'NPC corporation': (id) => p.getNpcCorporation(id),
      'NPC character': (id) => p.getNpcCharacter(id),
      'corporation activity': (id) => p.getCorporationActivity(id),
      'NPC corporation division': (id) => p.getNpcCorporationDivision(id),
      'agent type': (id) => p.getAgentType(id),
      'agent in space': (id) => p.getAgentInSpace(id),
    };
    this.result = lookups[noun]!(Number(id));
  },
);
