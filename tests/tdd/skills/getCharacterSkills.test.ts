import { GetCharacterSkillsApi } from '../../../src/api/skills/getCharacterSkills';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const characterSkillsApi = new GetCharacterSkillsApi(client);

describe('GetCharacterSkillsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return character skills', async () => {
        const mockResponse = {
            total_sp: 5000000,
            skills: [
                {
                    skill_id: 1,
                    skillpoints_in_skill: 500000,
                    trained_skill_level: 5,
                    active_skill_level: 5
                }
            ]
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => characterSkillsApi.getCharacterSkills(123456));

        expect(result).toHaveProperty('total_sp');
        expect(typeof result.total_sp).toBe('number');
        expect(Array.isArray(result.skills)).toBe(true);
        result.skills.forEach((skill: { skill_id: number, skillpoints_in_skill: number, trained_skill_level: number, active_skill_level: number }) => {
            expect(skill).toHaveProperty('skill_id');
            expect(typeof skill.skill_id).toBe('number');
            expect(skill).toHaveProperty('skillpoints_in_skill');
            expect(typeof skill.skillpoints_in_skill).toBe('number');
            expect(skill).toHaveProperty('trained_skill_level');
            expect(typeof skill.trained_skill_level).toBe('number');
            expect(skill).toHaveProperty('active_skill_level');
            expect(typeof skill.active_skill_level).toBe('number');
        });
    });
});
