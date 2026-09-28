import { When } from '../../support/steps';
import { parseSdeMetadata } from '../../../../src/sde/ingestion/metadata';
import { metadataText } from '../../support/sdeFiles';

When(
  'the metadata text with build {string} at the top level is parsed',
  function (top: string) {
    this.result = parseSdeMetadata(metadataText({ top }));
  },
);
