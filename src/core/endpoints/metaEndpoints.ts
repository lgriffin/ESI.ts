import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  MetaChangelogSchema,
  MetaCompatibilityDatesSchema,
  MetaNameSchema,
  MetaStatusSchema,
} from '../../schemas/meta';

export const metaEndpoints = {
  getOpenApiJson: fromOperation('GetMetaOpenapiJson', {
    responseSchema: z.record(z.string(), z.unknown()),
  }),
  getOpenApiYaml: fromOperation('GetMetaOpenapiYaml', {
    responseSchema: z.string(),
    textResponse: { accept: 'application/yaml, text/yaml, text/plain' },
  }),
  getChangelog: fromOperation('GetMetaChangelog', {
    responseSchema: MetaChangelogSchema,
  }),
  getCompatibilityDates: fromOperation('GetMetaCompatibilityDates', {
    responseSchema: MetaCompatibilityDatesSchema,
  }),
  getName: fromOperation('GetMetaName', {
    responseSchema: MetaNameSchema,
  }),
  getStatus: fromOperation('GetMetaStatus', {
    responseSchema: MetaStatusSchema,
  }),
} as const satisfies EndpointMap;
