import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

// The presentation tables (0015), one lookup per noun.
When(
  /^I look up (meta group|icon|graphic|skin|skin license|notification type) (\d+)$/,
  function (noun: string, id: string) {
    const p = sdeProvider(this);
    const lookups: Record<string, (id: number) => unknown> = {
      'meta group': (id) => p.getMetaGroup(id),
      icon: (id) => p.getIcon(id),
      graphic: (id) => p.getGraphic(id),
      skin: (id) => p.getSkin(id),
      'skin license': (id) => p.getSkinLicense(id),
      'notification type': (id) => p.getNotificationType(id),
    };
    this.result = lookups[noun]!(Number(id));
  },
);
