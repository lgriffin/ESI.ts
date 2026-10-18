import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  WalletJournalSchema,
  WalletTransactionSchema,
  CorporationWalletTransactionSchema,
} from '../../schemas/wallet';
import { CorporationWalletDivisionSchema } from '../../schemas/corporation';

export const walletEndpoints = {
  getCharacterWallet: fromOperation('GetCharactersCharacterIdWallet', {
    pathParams: ['characterId'],
    responseSchema: z.number(),
  }),
  getCharacterWalletJournal: fromOperation(
    'GetCharactersCharacterIdWalletJournal',
    {
      pathParams: ['characterId'],
      responseSchema: z.array(WalletJournalSchema),
    },
  ),
  getCharacterWalletTransactions: fromOperation(
    'GetCharactersCharacterIdWalletTransactions',
    {
      pathParams: ['characterId'],
      responseSchema: z.array(WalletTransactionSchema),
    },
  ),
  getCorporationWallets: fromOperation('GetCorporationsCorporationIdWallets', {
    pathParams: ['corporationId'],
    responseSchema: z.array(CorporationWalletDivisionSchema),
  }),
  getCorporationWalletJournal: fromOperation(
    'GetCorporationsCorporationIdWalletsDivisionJournal',
    {
      pathParams: ['corporationId', 'division'],
      responseSchema: z.array(WalletJournalSchema),
    },
  ),
  getCorporationWalletTransactions: fromOperation(
    'GetCorporationsCorporationIdWalletsDivisionTransactions',
    {
      pathParams: ['corporationId', 'division'],
      responseSchema: z.array(CorporationWalletTransactionSchema),
    },
  ),
} as const satisfies EndpointMap;
