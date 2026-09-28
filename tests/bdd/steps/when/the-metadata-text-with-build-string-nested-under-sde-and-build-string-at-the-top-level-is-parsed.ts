import { When } from '../../support/steps';
import { parseSdeMetadata } from '../../../../src/sde/ingestion/metadata';
import { metadataText } from '../../support/sdeFiles';

When(
  'the metadata text with build {string} nested under sde and build {string} at the top level is parsed',
  function (nested: string, top: string) {
    this.result = parseSdeMetadata(metadataText({ nested, top }));
  },
);
