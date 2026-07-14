import { UiClient } from '../../../src/clients/UiClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';
import { describeClientErrors } from '../helpers/clientErrorTests';

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

    const result = await getBody(() =>
      uiClient.setAutopilotWaypoint(30002505, false, true),
    );

    expect(result).toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/ui/autopilot/waypoint?destination_id=30002505&add_to_beginning=false&clear_other_waypoints=true',
    );
  });

  it('should open contract window', async () => {
    fetchMock.mockResponseOnce('', { status: 204 });

    const result = await getBody(() => uiClient.openContractWindow(123456789));

    expect(result).toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/ui/openwindow/contract?contract_id=123456789',
    );
  });

  it('should open information window', async () => {
    fetchMock.mockResponseOnce('', { status: 204 });

    const result = await getBody(() =>
      uiClient.openInformationWindow(123456789),
    );

    expect(result).toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/ui/openwindow/information?target_id=123456789',
    );
  });

  it('should open market details window', async () => {
    fetchMock.mockResponseOnce('', { status: 204 });

    const result = await getBody(() =>
      uiClient.openMarketDetailsWindow(123456),
    );

    expect(result).toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/ui/openwindow/marketdetails?type_id=123456',
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

  describeClientErrors('UiClient', () =>
    uiClient.openInformationWindow(123456789),
  );
});
