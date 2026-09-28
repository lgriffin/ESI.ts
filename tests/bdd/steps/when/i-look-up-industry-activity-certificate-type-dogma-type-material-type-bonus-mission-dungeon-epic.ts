import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

// The industry, type extension and mission content tables (0017, 0018).
When(
  /^I look up (industry activity|certificate|type dogma|type material|type bonus|mission|dungeon|epic arc) (\d+)$/,
  function (noun: string, id: string) {
    const p = sdeProvider(this);
    const lookups: Record<string, (id: number) => unknown> = {
      'industry activity': (id) => p.getIndustryActivity(id),
      certificate: (id) => p.getCertificate(id),
      'type dogma': (id) => p.getTypeDogma(id),
      'type material': (id) => p.getTypeMaterial(id),
      'type bonus': (id) => p.getTypeBonus(id),
      mission: (id) => p.getMission(id),
      dungeon: (id) => p.getDungeon(id),
      'epic arc': (id) => p.getEpicArc(id),
    };
    this.result = lookups[noun]!(Number(id));
  },
);
