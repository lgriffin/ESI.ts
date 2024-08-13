import { UIClient } from '../../../src/clients/UiClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

describe('UIClient', () => {
    let uiClient: UIClient;

    beforeEach(() => {
        fetchMock.resetMocks();
        uiClient = new UIClient(client);
    });

    it('should set autopilot waypoint', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });
        const body = {
            destination_id: 30002505,
            clear_other_waypoints: true,
            add_to_beginning: false
        };

        const result = await getBody(() => uiClient.setAutopilotWaypoint(body));

        expect(result).toEqual({ error: 'no content' });
    });

    it('should open contract window', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });
        const body = {
            contract_id: 123456789
        };

        const result = await getBody(() => uiClient.openContractWindow(body));

        expect(result).toEqual({ error: 'no content' });
    });

    it('should open information window', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });
        const body = {
            target_id: 123456789
        };

        const result = await getBody(() => uiClient.openInformationWindow(body));

        expect(result).toEqual({ error: 'no content' });
    });

    it('should open market details window', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });
        const body = {
            type_id: 123456
        };

        const result = await getBody(() => uiClient.openMarketDetailsWindow(body));

        expect(result).toEqual({ error: 'no content' });
    });

    it('should open new mail window', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });
        const body = {
            to: [123456789],
            subject: 'Test Subject',
            body: 'Test Body'
        };

        const result = await getBody(() => uiClient.openNewMailWindow(body));

        expect(result).toEqual({ error: 'no content' });
    });
});
