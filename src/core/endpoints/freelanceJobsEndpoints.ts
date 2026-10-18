import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  FreelanceJobsListingSchema,
  FreelanceJobDetailSchema,
  CharacterFreelanceJobsListingSchema,
  FreelanceJobParticipationSchema,
  CorporationFreelanceJobsListingSchema,
  FreelanceJobParticipantsListingSchema,
} from '../../schemas/freelance-jobs';

export const freelanceJobsEndpoints = {
  getFreelanceJobs: fromOperation('GetFreelanceJobsListing', {
    queryParams: { before: 'before', after: 'after' },
    responseSchema: FreelanceJobsListingSchema,
  }),
  getFreelanceJobById: fromOperation('GetFreelanceJobsDetail', {
    pathParams: ['jobId'],
    responseSchema: FreelanceJobDetailSchema,
  }),
  getCharacterFreelanceJobs: fromOperation(
    'GetCharactersFreelanceJobsListing',
    {
      pathParams: ['characterId'],
      queryParams: { before: 'before', after: 'after' },
      responseSchema: CharacterFreelanceJobsListingSchema,
    },
  ),
  getCharacterFreelanceJobParticipation: fromOperation(
    'GetCharactersFreelanceJobsParticipation',
    {
      pathParams: ['characterId', 'jobId'],
      responseSchema: FreelanceJobParticipationSchema,
    },
  ),
  getCorporationFreelanceJobs: fromOperation(
    'GetCorporationsFreelanceJobsListing',
    {
      pathParams: ['corporationId'],
      queryParams: { before: 'before', after: 'after' },
      responseSchema: CorporationFreelanceJobsListingSchema,
    },
  ),
  getCorporationFreelanceJobParticipants: fromOperation(
    'GetCorporationsFreelanceJobsParticipants',
    {
      pathParams: ['corporationId', 'jobId'],
      responseSchema: FreelanceJobParticipantsListingSchema,
    },
  ),
} as const satisfies EndpointMap;
