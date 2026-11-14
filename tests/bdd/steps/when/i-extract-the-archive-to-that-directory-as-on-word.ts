import { When } from '../../support/steps';
import { extractArchive, platformNamed } from '../../support/sdeFiles';

When(
  'I extract the archive to that directory as on {word}',
  function (platform: string) {
    extractArchive(this, platformNamed(platform));
  },
);
