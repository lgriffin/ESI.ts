/**
 * BDD-Style Testing for Character Skills API
 *
 * This demonstrates BDD principles for the Skills API
 * using Given/When/Then patterns.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD: Character Skills Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      accessToken: 'mock-access-token',
      timeout: 5000,
    });
  });

  describe('Feature: Retrieve Character Skills', () => {
    describe('Scenario: Get trained skills for a character', () => {
      it('Given a valid character ID, When I request character skills, Then I should receive the skills list with total SP', async () => {
        // Given
        const characterId = 90000001;
        const expectedSkills = TestDataFactory.createCharacterSkills();

        jest
          .spyOn(client.skills, 'getCharacterSkills')
          .mockResolvedValue(expectedSkills);

        // When
        const result = await client.skills.getCharacterSkills(characterId);

        // Then
        expect(result).toBeDefined();
        expect(result.skills).toHaveLength(2);
        expect(result.total_sp).toBe(384000);
        expect(result.skills[0].skill_id).toBe(3300);
        expect(result.skills[0].trained_skill_level).toBe(5);
      });
    });

    describe('Scenario: High-SP character with many skills', () => {
      it('Given a veteran character, When I request their skills, Then I should receive a large skill set with high total SP', async () => {
        // Given
        const characterId = 90000001;
        const manySkills = {
          skills: [
            TestDataFactory.createCharacterSkill({
              skill_id: 3300,
              skillpoints_in_skill: 1280000,
              trained_skill_level: 5,
            }),
            TestDataFactory.createCharacterSkill({
              skill_id: 3301,
              skillpoints_in_skill: 1280000,
              trained_skill_level: 5,
            }),
            TestDataFactory.createCharacterSkill({
              skill_id: 3302,
              skillpoints_in_skill: 512000,
              trained_skill_level: 5,
            }),
            TestDataFactory.createCharacterSkill({
              skill_id: 3303,
              skillpoints_in_skill: 256000,
              trained_skill_level: 4,
            }),
            TestDataFactory.createCharacterSkill({
              skill_id: 3304,
              skillpoints_in_skill: 768000,
              trained_skill_level: 5,
            }),
          ],
          total_sp: 80000000,
          unallocated_sp: 500000,
        };

        jest
          .spyOn(client.skills, 'getCharacterSkills')
          .mockResolvedValue(manySkills);

        // When
        const result = await client.skills.getCharacterSkills(characterId);

        // Then
        expect(result).toBeDefined();
        expect(result.skills).toHaveLength(5);
        expect(result.total_sp).toBe(80000000);
        expect(result.unallocated_sp).toBe(500000);
      });
    });
  });

  describe('Feature: Retrieve Skill Queue', () => {
    describe('Scenario: Get the skill training queue', () => {
      it('Given a character with skills in training, When I request the skill queue, Then I should receive an ordered queue', async () => {
        // Given
        const characterId = 90000001;
        const expectedQueue = [
          {
            skill_id: 3300,
            finished_level: 5,
            queue_position: 0,
            start_date: '2024-01-15T12:00:00Z',
            finish_date: '2024-01-20T12:00:00Z',
          },
          {
            skill_id: 3301,
            finished_level: 4,
            queue_position: 1,
            start_date: '2024-01-20T12:00:00Z',
            finish_date: '2024-02-01T12:00:00Z',
          },
          {
            skill_id: 3302,
            finished_level: 3,
            queue_position: 2,
            start_date: '2024-02-01T12:00:00Z',
            finish_date: '2024-02-05T12:00:00Z',
          },
        ];

        jest
          .spyOn(client.skills, 'getCharacterSkillQueue')
          .mockResolvedValue(expectedQueue as any);

        // When
        const result = await client.skills.getCharacterSkillQueue(characterId);

        // Then
        expect(result).toBeDefined();
        expect(result).toHaveLength(3);
        expect(result[0].queue_position).toBe(0);
        expect(result[1].queue_position).toBe(1);
        expect(result[2].queue_position).toBe(2);
        expect(result[0].skill_id).toBe(3300);
        expect(result[0].finished_level).toBe(5);
      });
    });

    describe('Scenario: Empty skill queue', () => {
      it('Given a character with no skills in training, When I request the skill queue, Then I should receive an empty array', async () => {
        // Given
        const characterId = 90000001;

        jest
          .spyOn(client.skills, 'getCharacterSkillQueue')
          .mockResolvedValue([]);

        // When
        const result = await client.skills.getCharacterSkillQueue(characterId);

        // Then
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
      });
    });
  });

  describe('Feature: Retrieve Character Attributes', () => {
    describe('Scenario: Get character neural remap attributes', () => {
      it('Given a valid character ID, When I request attributes, Then I should receive all five attributes and remap info', async () => {
        // Given
        const characterId = 90000001;
        const expectedAttributes = TestDataFactory.createCharacterAttributes();

        jest
          .spyOn(client.skills, 'getCharacterAttributes')
          .mockResolvedValue(expectedAttributes);

        // When
        const result = await client.skills.getCharacterAttributes(characterId);

        // Then
        expect(result).toBeDefined();
        expect(result.intelligence).toBe(24);
        expect(result.memory).toBe(21);
        expect(result.perception).toBe(23);
        expect(result.willpower).toBe(22);
        expect(result.charisma).toBe(20);
        expect(result.bonus_remaps).toBe(2);
      });
    });

    describe('Scenario: Attributes with custom remap', () => {
      it('Given a character with a perception-focused remap, When I request attributes, Then I should see elevated perception', async () => {
        // Given
        const characterId = 90000001;
        const perceptionFocused = TestDataFactory.createCharacterAttributes({
          perception: 32,
          willpower: 27,
          intelligence: 17,
          memory: 17,
          charisma: 17,
          bonus_remaps: 0,
        });

        jest
          .spyOn(client.skills, 'getCharacterAttributes')
          .mockResolvedValue(perceptionFocused);

        // When
        const result = await client.skills.getCharacterAttributes(characterId);

        // Then
        expect(result.perception).toBe(32);
        expect(result.willpower).toBe(27);
        expect(result.bonus_remaps).toBe(0);
      });
    });
  });

  describe('Feature: Skills Error Handling', () => {
    describe('Scenario: Unauthorized access to skills', () => {
      it('Given an invalid or expired token, When I request skills, Then I should receive a 403 error', async () => {
        // Given
        const characterId = 90000001;
        const error = TestDataFactory.createError(403);

        jest
          .spyOn(client.skills, 'getCharacterSkills')
          .mockRejectedValue(error);

        // When & Then
        await expect(
          client.skills.getCharacterSkills(characterId),
        ).rejects.toThrow(EsiError);
      });
    });
  });

  describe('Feature: Skills Workflow', () => {
    describe('Scenario: Concurrent fetch of skills, queue, and attributes', () => {
      it('Given a valid character, When I fetch skills, queue, and attributes concurrently, Then all three should return valid data', async () => {
        // Given
        const characterId = 90000001;
        const skillsData = TestDataFactory.createCharacterSkills();
        const queueData = [
          {
            skill_id: 3305,
            finished_level: 4,
            queue_position: 0,
            start_date: '2024-03-01T00:00:00Z',
            finish_date: '2024-03-10T00:00:00Z',
          },
        ];
        const attributesData = TestDataFactory.createCharacterAttributes();

        jest
          .spyOn(client.skills, 'getCharacterSkills')
          .mockResolvedValue(skillsData);
        jest
          .spyOn(client.skills, 'getCharacterSkillQueue')
          .mockResolvedValue(queueData as any);
        jest
          .spyOn(client.skills, 'getCharacterAttributes')
          .mockResolvedValue(attributesData);

        // When
        const [skills, queue, attributes] = await Promise.all([
          client.skills.getCharacterSkills(characterId),
          client.skills.getCharacterSkillQueue(characterId),
          client.skills.getCharacterAttributes(characterId),
        ]);

        // Then
        expect(skills.skills).toHaveLength(2);
        expect(skills.total_sp).toBe(384000);
        expect(queue).toHaveLength(1);
        expect(queue[0].queue_position).toBe(0);
        expect(attributes.intelligence).toBe(24);
        expect(attributes.perception).toBe(23);
      });
    });
  });
});
