import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  ContractSchema,
  PublicContractSchema,
  ContractBidSchema,
  ContractItemSchema,
  PublicContractBidSchema,
  PublicContractItemSchema,
} from '../../schemas/contracts';

export const contractEndpoints = {
  getCharacterContracts: fromOperation('GetCharactersCharacterIdContracts', {
    pathParams: ['characterId'],
    responseSchema: z.array(ContractSchema),
  }),
  getCharacterContractBids: fromOperation(
    'GetCharactersCharacterIdContractsContractIdBids',
    {
      pathParams: ['characterId', 'contractId'],
      responseSchema: z.array(ContractBidSchema),
    },
  ),
  getCharacterContractItems: fromOperation(
    'GetCharactersCharacterIdContractsContractIdItems',
    {
      pathParams: ['characterId', 'contractId'],
      responseSchema: z.array(ContractItemSchema),
    },
  ),
  getCorporationContracts: fromOperation(
    'GetCorporationsCorporationIdContracts',
    {
      pathParams: ['corporationId'],
      responseSchema: z.array(ContractSchema),
    },
  ),
  getCorporationContractBids: fromOperation(
    'GetCorporationsCorporationIdContractsContractIdBids',
    {
      pathParams: ['corporationId', 'contractId'],
      responseSchema: z.array(ContractBidSchema),
    },
  ),
  getCorporationContractItems: fromOperation(
    'GetCorporationsCorporationIdContractsContractIdItems',
    {
      pathParams: ['corporationId', 'contractId'],
      responseSchema: z.array(ContractItemSchema),
    },
  ),
  getPublicContracts: fromOperation('GetContractsPublicRegionId', {
    pathParams: ['regionId'],
    responseSchema: z.array(PublicContractSchema),
  }),
  getPublicContractBids: fromOperation('GetContractsPublicBidsContractId', {
    pathParams: ['contractId'],
    responseSchema: z.array(PublicContractBidSchema),
    // ESI answers an expired or accepted contract with no content.
    emptyWhenNoContent: true,
  }),
  getPublicContractItems: fromOperation('GetContractsPublicItemsContractId', {
    pathParams: ['contractId'],
    responseSchema: z.array(PublicContractItemSchema),
    // ESI answers an expired or accepted contract with no content.
    emptyWhenNoContent: true,
  }),
} as const satisfies EndpointMap;
