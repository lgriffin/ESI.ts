import { Given } from '../../support/steps';
import { RAW_SDE_FILES, writeSdeDirectory } from '../../support/sdeFiles';

Given(
  'an SDE directory holding the raw export files without _sde.yaml',
  function () {
    const { '_sde.yaml': _metadata, ...files } = RAW_SDE_FILES;
    void _metadata;
    writeSdeDirectory(this, files);
  },
);
