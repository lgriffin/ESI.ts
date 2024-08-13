import fetchMock from 'jest-fetch-mock';

export const mockApiCall = (apiCall: (...args: any[]) => Promise<any>, mockResponse: object, mockHeaders: Record<string, string> = {}) => {
    fetchMock.mockResponseOnce(
        JSON.stringify(mockResponse),
        { headers: mockHeaders }
    );

    return apiCall;
};

export const getHeaders = async (apiCall: () => Promise<any>): Promise<Record<string, string>> => {
    const response = await apiCall();
    return response.headers;
};

export const getBody = async (apiCall: () => Promise<any>): Promise<any> => {
    const response = await apiCall();
    return response.body;
};
