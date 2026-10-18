import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';

export const uiEndpoints = {
  setAutopilotWaypoint: fromOperation('PostUiAutopilotWaypoint', {
    queryParams: {
      destinationId: 'destination_id',
      addToBeginning: 'add_to_beginning',
      clearOtherWaypoints: 'clear_other_waypoints',
    },
  }),
  openContractWindow: fromOperation('PostUiOpenwindowContract', {
    queryParams: { contractId: 'contract_id' },
  }),
  openInformationWindow: fromOperation('PostUiOpenwindowInformation', {
    queryParams: { targetId: 'target_id' },
  }),
  openMarketDetailsWindow: fromOperation('PostUiOpenwindowMarketdetails', {
    queryParams: { typeId: 'type_id' },
  }),
  openNewMailWindow: fromOperation('PostUiOpenwindowNewmail', {
    hasBody: true,
  }),
} as const satisfies EndpointMap;
