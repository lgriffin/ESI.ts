import { ApiClient } from '../core/ApiClient';
import { ApiError, ApiErrorType } from '../core/errors/ApiError';
import { AllianceInfo, AllianceContact, AllianceContactLabel } from '../types/api-responses';

export interface MockConfig {
    delay?: number;
    failureRate?: number;
    networkErrors?: boolean;
    timeoutErrors?: boolean;
    serverErrors?: boolean;
}

export class TestDataFactory {
    static createAllianceInfo(overrides: Partial<AllianceInfo> = {}): AllianceInfo {
        return {
            alliance_id: 99005338,
            name: 'Goonswarm Federation',
            ticker: 'CONDI',
            creator_id: 1689391488,
            creator_corporation_id: 1344654522,
            executor_corporation_id: 1344654522,
            date_founded: '2010-06-01T00:00:00Z',
            faction_id: 500001,
            ...overrides
        };
    }

    static createAllianceContact(overrides: Partial<AllianceContact> = {}): AllianceContact {
        return {
            contact_id: 1689391488,
            contact_type: 'character',
            standing: 10.0,
            label_ids: [1, 2],
            ...overrides
        };
    }

    static createAllianceContactLabel(overrides: Partial<AllianceContactLabel> = {}): AllianceContactLabel {
        return {
            label_id: 1,
            label_name: 'Test Label',
            ...overrides
        };
    }

    static createError(type: ApiErrorType, statusCode?: number): ApiError {
        const messages = {
            [ApiErrorType.NETWORK_ERROR]: 'Network connection failed',
            [ApiErrorType.AUTHENTICATION_ERROR]: 'Authentication failed',
            [ApiErrorType.AUTHORIZATION_ERROR]: 'Access denied',
            [ApiErrorType.RATE_LIMIT_ERROR]: 'Rate limit exceeded',
            [ApiErrorType.SERVER_ERROR]: 'Internal server error',
            [ApiErrorType.CLIENT_ERROR]: 'Bad request',
            [ApiErrorType.VALIDATION_ERROR]: 'Validation failed',
            [ApiErrorType.NOT_FOUND_ERROR]: 'Resource not found',
            [ApiErrorType.TIMEOUT_ERROR]: 'Request timeout',
            [ApiErrorType.UNKNOWN_ERROR]: 'Unknown error occurred'
        };

        return new ApiError(messages[type], type, statusCode);
    }
}

export class MockApiClient {
    private config: MockConfig;

    constructor(config: MockConfig = {}) {
        this.config = {
            delay: 0,
            failureRate: 0,
            networkErrors: false,
            timeoutErrors: false,
            serverErrors: false,
            ...config
        };
    }

    async mockRequest<T>(data: T): Promise<T> {
        // Simulate network delay
        if (this.config.delay && this.config.delay > 0) {
            await this.delay(this.config.delay);
        }

        // Simulate random failures
        if (this.config.failureRate && Math.random() < this.config.failureRate) {
            throw this.generateRandomError();
        }

        return data;
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private generateRandomError(): ApiError {
        const errorTypes = [];
        
        if (this.config.networkErrors) errorTypes.push(ApiErrorType.NETWORK_ERROR);
        if (this.config.timeoutErrors) errorTypes.push(ApiErrorType.TIMEOUT_ERROR);
        if (this.config.serverErrors) errorTypes.push(ApiErrorType.SERVER_ERROR);
        
        if (errorTypes.length === 0) {
            errorTypes.push(ApiErrorType.CLIENT_ERROR);
        }

        const randomType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
        return TestDataFactory.createError(randomType, this.getStatusCodeForError(randomType));
    }

    private getStatusCodeForError(type: ApiErrorType): number {
        switch (type) {
            case ApiErrorType.AUTHENTICATION_ERROR: return 401;
            case ApiErrorType.AUTHORIZATION_ERROR: return 403;
            case ApiErrorType.NOT_FOUND_ERROR: return 404;
            case ApiErrorType.RATE_LIMIT_ERROR: return 429;
            case ApiErrorType.SERVER_ERROR: return 500;
            case ApiErrorType.CLIENT_ERROR: return 400;
            default: return 500;
        }
    }
}

export class TestScenarios {
    static async testRetryLogic<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3,
        expectedFailures: number = 2
    ): Promise<T> {
        let attempts = 0;
        let lastError: Error;

        while (attempts < maxRetries) {
            try {
                attempts++;
                const result = await operation();
                
                if (attempts <= expectedFailures) {
                    throw new Error(`Expected failure on attempt ${attempts}`);
                }
                
                return result;
            } catch (error) {
                lastError = error as Error;
                
                if (attempts >= maxRetries) {
                    throw lastError;
                }

                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts - 1) * 100));
            }
        }

        throw lastError!;
    }

    static async testConcurrency<T>(
        operation: () => Promise<T>,
        concurrentRequests: number = 10
    ): Promise<T[]> {
        const promises = Array(concurrentRequests)
            .fill(null)
            .map(() => operation());

        return Promise.all(promises);
    }

    static async testErrorRecovery<T>(
        operation: () => Promise<T>,
        fallbackOperation: () => Promise<T>
    ): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            console.warn('Primary operation failed, trying fallback:', error);
            return await fallbackOperation();
        }
    }
}

export class TestAssertions {
    static assertValidAllianceInfo(data: any): asserts data is AllianceInfo {
        if (!data || typeof data !== 'object') {
            throw new Error('Alliance info must be an object');
        }

        const required = ['alliance_id', 'name', 'ticker', 'creator_id', 'creator_corporation_id', 'date_founded'];
        for (const field of required) {
            if (!(field in data)) {
                throw new Error(`Alliance info missing required field: ${field}`);
            }
        }

        if (typeof data.alliance_id !== 'number' || data.alliance_id <= 0) {
            throw new Error('Alliance ID must be a positive number');
        }

        if (typeof data.name !== 'string' || data.name.length === 0) {
            throw new Error('Alliance name must be a non-empty string');
        }

        if (typeof data.ticker !== 'string' || data.ticker.length === 0) {
            throw new Error('Alliance ticker must be a non-empty string');
        }
    }

    static assertValidError(error: any): asserts error is ApiError {
        if (!(error instanceof ApiError)) {
            throw new Error('Expected ApiError instance');
        }

        if (!error.type || !Object.values(ApiErrorType).includes(error.type)) {
            throw new Error(`Invalid error type: ${error.type}`);
        }

        if (!error.message || error.message.length === 0) {
            throw new Error('Error must have a non-empty message');
        }

        if (!error.timestamp || !(error.timestamp instanceof Date)) {
            throw new Error('Error must have a valid timestamp');
        }
    }

    static assertResponseTime(startTime: number, maxMs: number): void {
        const elapsed = Date.now() - startTime;
        if (elapsed > maxMs) {
            throw new Error(`Response time ${elapsed}ms exceeded maximum ${maxMs}ms`);
        }
    }

    static assertArrayNotEmpty<T>(array: T[], message?: string): void {
        if (!Array.isArray(array) || array.length === 0) {
            throw new Error(message || 'Array must not be empty');
        }
    }
}

export function createMockApiClient(config: MockConfig = {}): ApiClient {
    // This would be a more sophisticated mock in a real implementation
    const mockClient = new ApiClient('test-client', 'https://esi.evetech.net', 'mock-token');
    
    // Override methods for testing
    const originalGetLink = mockClient.getLink;
    mockClient.getLink = function() {
        if (config.networkErrors && Math.random() < 0.1) {
            throw TestDataFactory.createError(ApiErrorType.NETWORK_ERROR);
        }
        return originalGetLink.call(this);
    };

    return mockClient;
}

// Export utility functions that were in the original testHelpers
export const getBody = async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
        return await operation();
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError('Operation failed', ApiErrorType.UNKNOWN_ERROR, undefined, error);
    }
};

export const getHeaders = (client: ApiClient): Record<string, string> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'ESI.ts/2.0.0'
    };

    const authHeader = client.getAuthorizationHeader();
    if (authHeader) {
        headers['Authorization'] = authHeader;
    }

    return headers;
};
