import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

// The universe reference tables (0016), one lookup per noun.
When(
  /^I look up (landmark|secondary sun|station operation|station service) (\d+)$/,
  function (noun: string, id: string) {
    const p = sdeProvider(this);
    const lookups: Record<string, (id: number) => unknown> = {
      landmark: (id) => p.getLandmark(id),
      'secondary sun': (id) => p.getSecondarySun(id),
      'station operation': (id) => p.getStationOperation(id),
      'station service': (id) => p.getStationService(id),
    };
    this.result = lookups[noun]!(Number(id));
  },
);
