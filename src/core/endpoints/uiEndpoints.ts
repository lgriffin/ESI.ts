import { EndpointMap } from './EndpointDefinition';

export const uiEndpoints = {
  setAutopilotWaypoint: {
    path: 'ui/autopilot/waypoint',
    method: 'POST',
    requiresAuth: true,
    hasBody: true,
  },
  openContractWindow: {
    path: 'ui/openwindow/contract',
    method: 'POST',
    requiresAuth: true,
    hasBody: true,
  },
  openInformationWindow: {
    path: 'ui/openwindow/information',
    method: 'POST',
    requiresAuth: true,
    hasBody: true,
  },
  openMarketDetailsWindow: {
    path: 'ui/openwindow/marketdetails',
    method: 'POST',
    requiresAuth: true,
    hasBody: true,
  },
  openNewMailWindow: {
    path: 'ui/openwindow/newmail',
    method: 'POST',
    requiresAuth: true,
    hasBody: true,
  },
} as const satisfies EndpointMap;
