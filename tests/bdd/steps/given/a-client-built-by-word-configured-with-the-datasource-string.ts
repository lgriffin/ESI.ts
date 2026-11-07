import { buildSurface, type Surface } from '../../support/client-construction';
import type { EsiDatasource } from '../../../../src/core/ApiClient';
import { Given } from '../../support/steps';

Given(
  'a client built by {word} configured with the datasource {string}',
  function (surface: string, datasource: string) {
    buildSurface(this, surface as Surface, {
      datasource: datasource as EsiDatasource,
    });
  },
);
