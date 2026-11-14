import { When } from '../../support/steps';
import { platformNamed, tryExtractArchive } from '../../support/sdeFiles';

When(
  'I try to extract the archive to that directory as on {word}',
  function (platform: string) {
    tryExtractArchive(this, platformNamed(platform));
  },
);
