import { EndpointMap } from './EndpointDefinition';

export const uiEndpoints = {
  setAutopilotWaypoint: {
    path: 'ui/autopilot/waypoint',
    method: 'POST',
    requiresAuth: true,
    queryParams: {
      destinationId: 'destination_id',
      addToBeginning: 'add_to_beginning',
      clearOtherWaypoints: 'clear_other_waypoints',
    },
  },
  openContractWindow: {
    path: 'ui/openwindow/contract',
    method: 'POST',
    requiresAuth: true,
    queryParams: { contractId: 'contract_id' },
  },
  openInformationWindow: {
    path: 'ui/openwindow/information',
    method: 'POST',
    requiresAuth: true,
    queryParams: { targetId: 'target_id' },
  },
  openMarketDetailsWindow: {
    path: 'ui/openwindow/marketdetails',
    method: 'POST',
    requiresAuth: true,
    queryParams: { typeId: 'type_id' },
  },
  openNewMailWindow: {
    path: 'ui/openwindow/newmail',
    method: 'POST',
    requiresAuth: true,
    hasBody: true,
  },
} as const satisfies EndpointMap;
