import { GetCorporationCustomsOfficesApi } from '../../../src/api/pi/getCorporationCustomsOffices';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const customsOfficesApi = new GetCorporationCustomsOfficesApi(client);

describe('GetCorporationCustomsOfficesApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return corporation customs offices', async () => {
        const mockResponse = [
            {
                office_id: 123456,
                system_id: 654321,
                reinforce_exit_start: 2,
                reinforce_exit_end: 14,
                allow_alliance_access: true,
                tax_rate: 0.05,
                alliance_tax_rate: 0.02,
                corp_tax_rate: 0.01
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await customsOfficesApi.getCorporationCustomsOffices(123456);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((office: {
            office_id: number,
            system_id: number,
            reinforce_exit_start: number,
            reinforce_exit_end: number,
            allow_alliance_access: boolean,
            tax_rate: number,
            alliance_tax_rate: number,
            corp_tax_rate: number
        }) => {
            expect(office).toHaveProperty('office_id');
            expect(typeof office.office_id).toBe('number');
            expect(office).toHaveProperty('system_id');
            expect(typeof office.system_id).toBe('number');
            expect(office).toHaveProperty('reinforce_exit_start');
            expect(typeof office.reinforce_exit_start).toBe('number');
            expect(office).toHaveProperty('reinforce_exit_end');
            expect(typeof office.reinforce_exit_end).toBe('number');
            expect(office).toHaveProperty('allow_alliance_access');
            expect(typeof office.allow_alliance_access).toBe('boolean');
            expect(office).toHaveProperty('tax_rate');
            expect(typeof office.tax_rate).toBe('number');
            expect(office).toHaveProperty('alliance_tax_rate');
            expect(typeof office.alliance_tax_rate).toBe('number');
            expect(office).toHaveProperty('corp_tax_rate');
            expect(typeof office.corp_tax_rate).toBe('number');
        });
    });
});

