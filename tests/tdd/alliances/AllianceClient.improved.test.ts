import { AllianceClient } from '../../../src/clients/AllianceClient';
import { ApiClient } from '../../../src/core/ApiClient';
import { ApiError, ApiErrorType } from '../../../src/core/errors/ApiError';
import { 
    TestDataFactory, 
    MockApiClient, 
    TestScenarios, 
    TestAssertions,
    createMockApiClient
} from '../../../src/testing/TestHelpers';
import { AllianceInfo } from '../../../src/types/api-responses';

// Mock the actual API modules
jest.mock('../../../src/api/alliances/getAllianceById');
jest.mock('../../../src/api/alliances/getAllianceContacts');
jest.mock('../../../src/api/alliances/getAllianceContactLabels');

describe('AllianceClient - Resilient Tests', () => {
    let allianceClient: AllianceClient;
    let mockApiClient: ApiClient;
    let mockAlliance: AllianceInfo;

    beforeEach(() => {
        mockApiClient = createMockApiClient();
        allianceClient = new AllianceClient(mockApiClient);
        mockAlliance = TestDataFactory.createAllianceInfo();

        // Reset all mocks
        jest.clearAllMocks();
    });

    describe('getAllianceById', () => {
        it('should return valid alliance info with proper types', async () => {
            const startTime = Date.now();
            
            // Mock the API response
            const mockGetAllianceById = jest.fn().mockResolvedValue(mockAlliance);
            (allianceClient as any).allianceApi = { getAllianceById: mockGetAllianceById };

            const result = await allianceClient.getAllianceById(mockAlliance.alliance_id);

            // Assertions
            TestAssertions.assertValidAllianceInfo(result);
            TestAssertions.assertResponseTime(startTime, 1000); // Max 1 second
            
            expect(result.alliance_id).toBe(mockAlliance.alliance_id);
            expect(result.name).toBe(mockAlliance.name);
            expect(mockGetAllianceById).toHaveBeenCalledWith(mockAlliance.alliance_id);
        });

        it('should handle network errors gracefully', async () => {
            const networkError = TestDataFactory.createError(ApiErrorType.NETWORK_ERROR);
            const mockGetAllianceById = jest.fn().mockRejectedValue(networkError);
            (allianceClient as any).allianceApi = { getAllianceById: mockGetAllianceById };

            await expect(allianceClient.getAllianceById(99005338))
                .rejects
                .toThrow(ApiError);

            try {
                await allianceClient.getAllianceById(99005338);
            } catch (error) {
                TestAssertions.assertValidError(error);
                expect(error.type).toBe(ApiErrorType.NETWORK_ERROR);
            }
        });

        it('should validate input parameters', async () => {
            // Mock the API to simulate validation
            const mockGetAllianceById = jest.fn().mockImplementation((id) => {
                if (!id || id <= 0) {
                    throw TestDataFactory.createError(ApiErrorType.VALIDATION_ERROR, 400);
                }
                return Promise.resolve(mockAlliance);
            });
            (allianceClient as any).allianceApi = { getAllianceById: mockGetAllianceById };

            const invalidInputs = [0, -1, NaN];

            for (const invalidInput of invalidInputs) {
                await expect(allianceClient.getAllianceById(invalidInput as any))
                    .rejects
                    .toThrow(ApiError);
            }
        });

        it('should handle rate limiting with proper error type', async () => {
            const rateLimitError = TestDataFactory.createError(ApiErrorType.RATE_LIMIT_ERROR, 429);
            const mockGetAllianceById = jest.fn().mockRejectedValue(rateLimitError);
            (allianceClient as any).allianceApi = { getAllianceById: mockGetAllianceById };

            try {
                await allianceClient.getAllianceById(99005338);
            } catch (error) {
                expect(error).toBeInstanceOf(ApiError);
                if (error instanceof ApiError) {
                    expect(error.type).toBe(ApiErrorType.RATE_LIMIT_ERROR);
                    expect(error.statusCode).toBe(429);
                }
            }
        });

        it('should handle concurrent requests', async () => {
            const mockGetAllianceById = jest.fn().mockResolvedValue(mockAlliance);
            (allianceClient as any).allianceApi = { getAllianceById: mockGetAllianceById };

            const results = await TestScenarios.testConcurrency(
                () => allianceClient.getAllianceById(99005338),
                5
            );

            expect(results).toHaveLength(5);
            results.forEach(result => {
                TestAssertions.assertValidAllianceInfo(result);
            });
            expect(mockGetAllianceById).toHaveBeenCalledTimes(5);
        });

        it('should handle server errors and provide meaningful error info', async () => {
            const serverError = TestDataFactory.createError(ApiErrorType.SERVER_ERROR, 500);
            const mockGetAllianceById = jest.fn().mockRejectedValue(serverError);
            (allianceClient as any).allianceApi = { getAllianceById: mockGetAllianceById };

            try {
                await allianceClient.getAllianceById(99005338);
            } catch (error) {
                TestAssertions.assertValidError(error);
                expect(error.type).toBe(ApiErrorType.SERVER_ERROR);
                expect(error.statusCode).toBe(500);
                expect(error.timestamp).toBeInstanceOf(Date);
            }
        });
    });

    describe('getContacts', () => {
        it('should return array of contacts with proper validation', async () => {
            const mockContacts = [
                TestDataFactory.createAllianceContact(),
                TestDataFactory.createAllianceContact({ contact_id: 2, contact_type: 'corporation' })
            ];

            const mockGetContacts = jest.fn().mockResolvedValue(mockContacts);
            (allianceClient as any).allianceContactsApi = { getAllianceContacts: mockGetContacts };

            const result = await allianceClient.getContacts(99005338);

            TestAssertions.assertArrayNotEmpty(result, 'Contacts array should not be empty');
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(2);
            
            result.forEach(contact => {
                expect(contact).toHaveProperty('contact_id');
                expect(contact).toHaveProperty('contact_type');
                expect(contact).toHaveProperty('standing');
                expect(typeof contact.contact_id).toBe('number');
                expect(['character', 'corporation', 'alliance']).toContain(contact.contact_type);
                expect(typeof contact.standing).toBe('number');
            });
        });

        it('should handle empty results gracefully', async () => {
            const mockGetContacts = jest.fn().mockResolvedValue([]);
            (allianceClient as any).allianceContactsApi = { getAllianceContacts: mockGetContacts };

            const result = await allianceClient.getContacts(99005338);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(0);
        });
    });

    describe('Error Recovery Scenarios', () => {
        it('should implement fallback mechanism', async () => {
            const primaryError = TestDataFactory.createError(ApiErrorType.SERVER_ERROR, 500);
            const fallbackData = TestDataFactory.createAllianceInfo({ name: 'Fallback Alliance' });

            const primaryOperation = jest.fn().mockRejectedValue(primaryError);
            const fallbackOperation = jest.fn().mockResolvedValue(fallbackData);

            const result = await TestScenarios.testErrorRecovery(
                primaryOperation,
                fallbackOperation
            );

            expect((result as any).name).toBe('Fallback Alliance');
            expect(primaryOperation).toHaveBeenCalledTimes(1);
            expect(fallbackOperation).toHaveBeenCalledTimes(1);
        });

        it('should test retry logic with exponential backoff', async () => {
            let attemptCount = 0;
            const mockOperation = jest.fn().mockImplementation(() => {
                attemptCount++;
                if (attemptCount <= 2) {
                    throw TestDataFactory.createError(ApiErrorType.NETWORK_ERROR);
                }
                return Promise.resolve(mockAlliance);
            });

            const result = await TestScenarios.testRetryLogic(mockOperation, 3, 2);

            expect(result).toEqual(mockAlliance);
            expect(mockOperation).toHaveBeenCalledTimes(3);
        });
    });

    describe('Performance Tests', () => {
        it('should complete requests within acceptable time limits', async () => {
            const mockGetAllianceById = jest.fn().mockImplementation(async () => {
                // Simulate some processing time
                await new Promise(resolve => setTimeout(resolve, 100));
                return mockAlliance;
            });
            (allianceClient as any).allianceApi = { getAllianceById: mockGetAllianceById };

            const startTime = Date.now();
            const result = await allianceClient.getAllianceById(99005338);
            
            TestAssertions.assertResponseTime(startTime, 500); // Max 500ms
            expect(result).toEqual(mockAlliance);
        });

        it('should handle high-frequency requests', async () => {
            const mockGetAllianceById = jest.fn().mockResolvedValue(mockAlliance);
            (allianceClient as any).allianceApi = { getAllianceById: mockGetAllianceById };

            const startTime = Date.now();
            const promises = Array(50).fill(null).map(() => 
                allianceClient.getAllianceById(99005338)
            );

            const results = await Promise.all(promises);
            
            TestAssertions.assertResponseTime(startTime, 2000); // Max 2 seconds for 50 requests
            expect(results).toHaveLength(50);
            expect(mockGetAllianceById).toHaveBeenCalledTimes(50);
        });
    });

    describe('Integration-like Tests', () => {
        it('should maintain consistent behavior across multiple operations', async () => {
            const mockGetAllianceById = jest.fn().mockResolvedValue(mockAlliance);
            const mockGetContacts = jest.fn().mockResolvedValue([TestDataFactory.createAllianceContact()]);
            const mockGetContactLabels = jest.fn().mockResolvedValue([TestDataFactory.createAllianceContactLabel()]);

            (allianceClient as any).allianceApi = { getAllianceById: mockGetAllianceById };
            (allianceClient as any).allianceContactsApi = { getAllianceContacts: mockGetContacts };
            (allianceClient as any).allianceContactLabelsApi = { getAllianceContactLabels: mockGetContactLabels };

            // Test multiple operations in sequence
            const allianceInfo = await allianceClient.getAllianceById(99005338);
            const contacts = await allianceClient.getContacts(99005338);
            const labels = await allianceClient.getContactLabels(99005338);

            // Verify all operations completed successfully
            TestAssertions.assertValidAllianceInfo(allianceInfo);
            TestAssertions.assertArrayNotEmpty(contacts);
            TestAssertions.assertArrayNotEmpty(labels);

            // Verify all mocks were called
            expect(mockGetAllianceById).toHaveBeenCalledTimes(1);
            expect(mockGetContacts).toHaveBeenCalledTimes(1);
            expect(mockGetContactLabels).toHaveBeenCalledTimes(1);
        });
    });
});
