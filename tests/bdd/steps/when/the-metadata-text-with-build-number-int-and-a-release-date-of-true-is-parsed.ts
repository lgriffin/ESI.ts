import { When } from '../../support/steps';
import { parseSdeMetadata } from '../../../../src/sde/ingestion/metadata';
import { untypedMetadataText } from '../../support/sdeFiles';

When(
  'the metadata text with build number {int} and a release date of true is parsed',
  function (buildNumber: number) {
    this.result = parseSdeMetadata(untypedMetadataText(buildNumber));
  },
);
