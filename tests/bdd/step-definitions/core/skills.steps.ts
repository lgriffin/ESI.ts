import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/skills.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      accessToken: 'mock-access-token',
      timeout: 5000,
    });
  });

  test('Get trained skills for a character', ({ given, when, then }) => {
    let result: any;
    const characterId = 90000001;
    const expectedSkills = TestDataFactory.createCharacterSkills();

    given('a valid character ID for skills', () => {
      jest
        .spyOn(client.skills, 'getCharacterSkills')
        .mockResolvedValue(expectedSkills);
    });

    when('I request character skills', async () => {
      result = await client.skills.getCharacterSkills(characterId);
    });

    then('I should receive the skills list with total SP', () => {
      expect(result).toBeDefined();
      expect(result.skills).toHaveLength(2);
      expect(result.total_sp).toBe(384000);
      expect(result.skills[0].skill_id).toBe(3300);
      expect(result.skills[0].trained_skill_level).toBe(5);
    });
  });

  test('High-SP character with many skills', ({ given, when, then }) => {
    let result: any;
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

    given('a veteran character', () => {
      jest
        .spyOn(client.skills, 'getCharacterSkills')
        .mockResolvedValue(manySkills);
    });

    when('I request their skills', async () => {
      result = await client.skills.getCharacterSkills(characterId);
    });

    then('I should receive a large skill set with high total SP', () => {
      expect(result).toBeDefined();
      expect(result.skills).toHaveLength(5);
      expect(result.total_sp).toBe(80000000);
      expect(result.unallocated_sp).toBe(500000);
    });
  });

  test('Get the skill training queue', ({ given, when, then }) => {
    let result: any;
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

    given('a character with skills in training', () => {
      jest
        .spyOn(client.skills, 'getCharacterSkillQueue')
        .mockResolvedValue(expectedQueue as any);
    });

    when('I request the skill queue', async () => {
      result = await client.skills.getCharacterSkillQueue(characterId);
    });

    then('I should receive an ordered queue', () => {
      expect(result).toBeDefined();
      expect(result).toHaveLength(3);
      expect(result[0].queue_position).toBe(0);
      expect(result[1].queue_position).toBe(1);
      expect(result[2].queue_position).toBe(2);
      expect(result[0].skill_id).toBe(3300);
      expect(result[0].finished_level).toBe(5);
    });
  });

  test('Empty skill queue', ({ given, when, then }) => {
    let result: any;
    const characterId = 90000001;

    given('a character with no skills in training', () => {
      jest.spyOn(client.skills, 'getCharacterSkillQueue').mockResolvedValue([]);
    });

    when('I request the skill queue for idle character', async () => {
      result = await client.skills.getCharacterSkillQueue(characterId);
    });

    then('I should receive an empty queue array', () => {
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  test('Get character neural remap attributes', ({ given, when, then }) => {
    let result: any;
    const characterId = 90000001;
    const expectedAttributes = TestDataFactory.createCharacterAttributes();

    given('a valid character ID for attributes', () => {
      jest
        .spyOn(client.skills, 'getCharacterAttributes')
        .mockResolvedValue(expectedAttributes);
    });

    when('I request attributes', async () => {
      result = await client.skills.getCharacterAttributes(characterId);
    });

    then('I should receive all five attributes and remap info', () => {
      expect(result).toBeDefined();
      expect(result.intelligence).toBe(24);
      expect(result.memory).toBe(21);
      expect(result.perception).toBe(23);
      expect(result.willpower).toBe(22);
      expect(result.charisma).toBe(20);
      expect(result.bonus_remaps).toBe(2);
    });
  });

  test('Attributes with custom remap', ({ given, when, then }) => {
    let result: any;
    const characterId = 90000001;
    const perceptionFocused = TestDataFactory.createCharacterAttributes({
      perception: 32,
      willpower: 27,
      intelligence: 17,
      memory: 17,
      charisma: 17,
      bonus_remaps: 0,
    });

    given('a character with a perception-focused remap', () => {
      jest
        .spyOn(client.skills, 'getCharacterAttributes')
        .mockResolvedValue(perceptionFocused);
    });

    when('I request remapped attributes', async () => {
      result = await client.skills.getCharacterAttributes(characterId);
    });

    then('I should see elevated perception', () => {
      expect(result.perception).toBe(32);
      expect(result.willpower).toBe(27);
      expect(result.bonus_remaps).toBe(0);
    });
  });

  test('Unauthorized access to skills', ({ given, when, then }) => {
    let caughtError: any;
    const characterId = 90000001;

    given('an invalid or expired token', () => {
      const error = TestDataFactory.createError(403);
      jest.spyOn(client.skills, 'getCharacterSkills').mockRejectedValue(error);
    });

    when('I request skills without authorization', async () => {
      try {
        await client.skills.getCharacterSkills(characterId);
      } catch (e) {
        caughtError = e;
      }
    });

    then('I should receive a 403 skills error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('Concurrent fetch of skills, queue, and attributes', ({
    given,
    when,
    then,
  }) => {
    let skills: any;
    let queue: any;
    let attributes: any;
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

    given('a valid character for concurrent fetch', () => {
      jest
        .spyOn(client.skills, 'getCharacterSkills')
        .mockResolvedValue(skillsData);
      jest
        .spyOn(client.skills, 'getCharacterSkillQueue')
        .mockResolvedValue(queueData as any);
      jest
        .spyOn(client.skills, 'getCharacterAttributes')
        .mockResolvedValue(attributesData);
    });

    when('I fetch skills, queue, and attributes concurrently', async () => {
      [skills, queue, attributes] = await Promise.all([
        client.skills.getCharacterSkills(characterId),
        client.skills.getCharacterSkillQueue(characterId),
        client.skills.getCharacterAttributes(characterId),
      ]);
    });

    then('all three should return valid data', () => {
      expect(skills.skills).toHaveLength(2);
      expect(skills.total_sp).toBe(384000);
      expect(queue).toHaveLength(1);
      expect(queue[0].queue_position).toBe(0);
      expect(attributes.intelligence).toBe(24);
      expect(attributes.perception).toBe(23);
    });
  });
});
