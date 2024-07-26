import { CharacterSkillsClient } from '../../../src/clients/SkillsClient';
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

const skillsClient = new CharacterSkillsClient(client);

describe('SkillsClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return character attributes', async () => {
        const mockResponse = {
            intelligence: 20,
            memory: 20,
            perception: 20,
            willpower: 20,
            charisma: 20
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await skillsClient.getCharacterAttributes(123456);

        expect(result).toHaveProperty('intelligence');
        expect(typeof result.intelligence).toBe('number');
        expect(result).toHaveProperty('memory');
        expect(typeof result.memory).toBe('number');
        expect(result).toHaveProperty('perception');
        expect(typeof result.perception).toBe('number');
        expect(result).toHaveProperty('willpower');
        expect(typeof result.willpower).toBe('number');
        expect(result).toHaveProperty('charisma');
        expect(typeof result.charisma).toBe('number');
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

        const result = await skillsClient.getCharacterSkills(123456);

        expect(result).toHaveProperty('total_sp');
        expect(typeof result.total_sp).toBe('number');
        expect(Array.isArray(result.skills)).toBe(true);
        (result.skills as { skill_id: number, skillpoints_in_skill: number, trained_skill_level: number, active_skill_level: number }[]).forEach(skill => {
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

    it('should return character skill queue', async () => {
        const mockResponse = [
            {
                skill_id: 1,
                finished_level: 5,
                start_sp: 5000,
                end_sp: 10000,
                start_time: '2024-07-01T12:00:00Z',
                finish_time: '2024-07-02T12:00:00Z'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await skillsClient.getCharacterSkillQueue(123456);

        expect(Array.isArray(result)).toBe(true);
        (result as { skill_id: number, finished_level: number, start_sp: number, end_sp: number, start_time: string, finish_time: string }[]).forEach(skill => {
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
