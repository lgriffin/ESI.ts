import { UiClient } from '../../../src/clients/UiClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const config = getConfig();
const client = new ApiClientBuilder()
  .setClientId(config.projectName)
  .setLink(config.link)
  .setAccessToken(process.env.ESI_ACCESS_TOKEN || 'test-token')
  .build();

describe('UiClient', () => {
  let uiClient: UiClient;

  beforeEach(() => {
    fetchMock.resetMocks();
    uiClient = new UiClient(client);
  });

  it('should set autopilot waypoint', async () => {
    fetchMock.mockResponseOnce('', { status: 204 });
    const body = {
      destination_id: 30002505,
      clear_other_waypoints: true,
      add_to_beginning: false,
    };

    const result = await getBody(() => uiClient.setAutopilotWaypoint(body));

    expect(result).toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/ui/autopilot/waypoint',
    );
  });

  it('should open contract window', async () => {
    fetchMock.mockResponseOnce('', { status: 204 });
    const body = {
      contract_id: 123456789,
    };

    const result = await getBody(() => uiClient.openContractWindow(body));

    expect(result).toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/ui/openwindow/contract',
    );
  });

  it('should open information window', async () => {
    fetchMock.mockResponseOnce('', { status: 204 });
    const body = {
      target_id: 123456789,
    };

    const result = await getBody(() => uiClient.openInformationWindow(body));

    expect(result).toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/ui/openwindow/information',
    );
  });

  it('should open market details window', async () => {
    fetchMock.mockResponseOnce('', { status: 204 });
    const body = {
      type_id: 123456,
    };

    const result = await getBody(() => uiClient.openMarketDetailsWindow(body));

    expect(result).toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/ui/openwindow/marketdetails',
    );
  });

  it('should open new mail window', async () => {
    fetchMock.mockResponseOnce('', { status: 204 });
    const body = {
      to: [123456789],
      subject: 'Test Subject',
      body: 'Test Body',
    };

    const result = await getBody(() => uiClient.openNewMailWindow(body));

    expect(result).toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/ui/openwindow/newmail',
    );
  });
});
