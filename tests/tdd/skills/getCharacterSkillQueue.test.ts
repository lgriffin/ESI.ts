import { GetCharacterSkillQueueApi } from '../../../src/api/skills/getCharacterSkillQueue';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();

const characterSkillQueueApi = new GetCharacterSkillQueueApi(client);

describe('GetCharacterSkillQueueApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for character skill queue', async () => {
        const mockResponse: Array<{ skill_id: number, finished_level: number, start_sp: number, end_sp: number, start_time: string, finish_time: string }> = [
            {
                skill_id: 1,
                finished_level: 5,
                start_sp: 0,
                end_sp: 256000,
                start_time: '2024-07-01T12:00:00Z',
                finish_time: '2024-07-02T12:00:00Z',
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await characterSkillQueueApi.getCharacterSkillQueue(123456789);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((skill: { skill_id: number, finished_level: number, start_sp: number, end_sp: number, start_time: string, finish_time: string }) => {
            expect(skill).toHaveProperty('skill_id');
            expect(typeof skill.skill_id).toBe('number');
            expect(skill).toHaveProperty('finished_level');
            expect(typeof skill.finished_level).toBe('number');
            expect(skill).toHaveProperty('start_sp');
            expect(typeof skill.start_sp).toBe('number');
            expect(skill).toHaveProperty('end_sp');
            expect(typeof skill.end_sp).toBe('number');
            expect(skill).toHaveProperty('start_time');
            expect(typeof skill.start_time).toBe('string');
            expect(skill).toHaveProperty('finish_time');
            expect(typeof skill.finish_time).toBe('string');
        });
    });
});
