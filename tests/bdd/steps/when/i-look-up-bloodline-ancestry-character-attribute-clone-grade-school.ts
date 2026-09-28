import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

// The character reference tables (0013), one lookup per noun.
When(
  /^I look up (bloodline|ancestry|character attribute|clone grade|school) (\d+)$/,
  function (noun: string, id: string) {
    const p = sdeProvider(this);
    const lookups: Record<string, (id: number) => unknown> = {
      bloodline: (id) => p.getBloodline(id),
      ancestry: (id) => p.getAncestry(id),
      'character attribute': (id) => p.getCharacterAttribute(id),
      'clone grade': (id) => p.getCloneGrade(id),
      school: (id) => p.getSchool(id),
    };
    this.result = lookups[noun]!(Number(id));
  },
);
