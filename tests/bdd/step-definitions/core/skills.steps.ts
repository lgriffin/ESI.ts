import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';
import {
  createSeamClient,
  lastRequest,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature('tests/bdd/features/core/0031-skills.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Two-skill character returns per-skill levels and total SP', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 90000001;
    const expectedSkills = TestDataFactory.createCharacterSkills();

    given('a valid character ID for skills', () => {
      queueResponse({
        match: `/characters/${characterId}/skills`,
        body: expectedSkills,
      });
    });

    when('the client requests character skills', async () => {
      result = await client.skills.getCharacterSkills(characterId);
    });

    then('the client shall return the skills list with total SP', () => {
      const request = lastRequest();
      expect(request.method).toBe('GET');
      expect(request.url.pathname).toBe(`/characters/${characterId}/skills`);
      expect(request.headers['authorization']).toBe('Bearer bdd-access-token');
      expect(result).toEqual({
        skills: [
          {
            skill_id: 3300,
            skillpoints_in_skill: 256000,
            trained_skill_level: 5,
            active_skill_level: 5,
          },
          {
            skill_id: 3301,
            skillpoints_in_skill: 128000,
            trained_skill_level: 4,
            active_skill_level: 4,
          },
        ],
        total_sp: 384000,
        unallocated_sp: 0,
      });
    });
  });

  test('Veteran character returns every skill entry and unallocated SP', ({
    given,
    when,
    then,
  }) => {
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
          active_skill_level: 4,
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
      queueResponse({
        match: `/characters/${characterId}/skills`,
        body: manySkills,
      });
    });

    when('the client requests their skills', async () => {
      result = await client.skills.getCharacterSkills(characterId);
    });

    then('the client shall return a large skill set with high total SP', () => {
      expect(result.skills.map((s: any) => s.skill_id)).toEqual([
        3300, 3301, 3302, 3303, 3304,
      ]);
      expect(result.skills[3]).toEqual({
        skill_id: 3303,
        skillpoints_in_skill: 256000,
        trained_skill_level: 4,
        active_skill_level: 4,
      });
      expect(result.total_sp).toBe(80000000);
      expect(result.unallocated_sp).toBe(500000);
    });
  });

  test('Three queued skills keep ascending queue positions', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 90000001;
    const expectedQueue = [
      {
        skill_id: 3300,
        finished_level: 5,
        queue_position: 0,
        level_start_sp: 256000,
        level_end_sp: 1280000,
        training_start_sp: 400000,
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
      queueResponse({
        match: `/characters/${characterId}/skillqueue`,
        body: expectedQueue,
      });
    });

    when('the client requests the skill queue', async () => {
      result = await client.skills.getCharacterSkillQueue(characterId);
    });

    then('the client shall return an ordered queue', () => {
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/skillqueue`,
      );
      expect(result).toEqual(expectedQueue);
      expect(result.map((q: any) => q.queue_position)).toEqual([0, 1, 2]);
    });
  });

  test('Idle character returns an empty queue array', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 90000001;

    given('a character with no skills in training', () => {
      queueResponse({
        match: `/characters/${characterId}/skillqueue`,
        body: [],
      });
    });

    when('the client requests the skill queue for idle character', async () => {
      result = await client.skills.getCharacterSkillQueue(characterId);
    });

    then('the client shall return an empty queue array', () => {
      expect(sentRequests()).toHaveLength(1);
      expect(result).toEqual([]);
    });
  });

  test('Default attribute spread returns all five values and remaps', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 90000001;

    given('a valid character ID for attributes', () => {
      queueResponse({
        match: `/characters/${characterId}/attributes`,
        body: TestDataFactory.createCharacterAttributes(),
      });
    });

    when('the client requests attributes', async () => {
      result = await client.skills.getCharacterAttributes(characterId);
    });

    then('the client shall return all five attributes and remap info', () => {
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/attributes`,
      );
      expect(result).toEqual({
        charisma: 20,
        intelligence: 24,
        memory: 21,
        perception: 23,
        willpower: 22,
        bonus_remaps: 2,
        last_remap_date: '2023-01-01T00:00:00Z',
        accrued_remap_cooldown_date: '2024-01-01T00:00:00Z',
      });
    });
  });

  test('Perception-weighted remap returns the reallocated values', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 90000001;

    given('a character with a perception-focused remap', () => {
      queueResponse({
        match: `/characters/${characterId}/attributes`,
        body: TestDataFactory.createCharacterAttributes({
          perception: 27,
          willpower: 21,
          intelligence: 17,
          memory: 17,
          charisma: 17,
          bonus_remaps: 0,
        }),
      });
    });

    when('the client requests remapped attributes', async () => {
      result = await client.skills.getCharacterAttributes(characterId);
    });

    then('the client shall report elevated perception', () => {
      expect(result).toMatchObject({
        perception: 27,
        willpower: 21,
        intelligence: 17,
        memory: 17,
        charisma: 17,
        bonus_remaps: 0,
      });
    });
  });

  test('Expired token rejects the skills request with an EsiError', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;
    const characterId = 90000001;

    given('an invalid or expired token', () => {
      // 403 is not retryable, so ESI answers exactly once.
      queueError(403, 'token is expired', {
        match: `/characters/${characterId}/skills`,
      });
    });

    when('the client requests skills without authorization', async () => {
      try {
        await client.skills.getCharacterSkills(characterId);
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a 403 skills error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(403);
      expect(sentRequests()).toHaveLength(1);
    });
  });

  test('Concurrent skills, queue, and attributes calls each resolve independently', ({
    given,
    when,
    then,
  }) => {
    let skills: any;
    let queue: any;
    let attributes: any;
    const characterId = 90000001;
    const queueData = [
      {
        skill_id: 3305,
        finished_level: 4,
        queue_position: 0,
        start_date: '2024-03-01T00:00:00Z',
        finish_date: '2024-03-10T00:00:00Z',
      },
    ];

    given('a valid character for concurrent fetch', () => {
      // Distinct delays make the responses arrive in a different order from
      // the requests, so a crossed wire would hand a payload to the wrong call.
      queueResponse({
        match: `/characters/${characterId}/skills`,
        body: TestDataFactory.createCharacterSkills(),
        delayMs: 30,
      });
      queueResponse({
        match: `/characters/${characterId}/skillqueue`,
        body: queueData,
        delayMs: 15,
      });
      queueResponse({
        match: `/characters/${characterId}/attributes`,
        body: TestDataFactory.createCharacterAttributes(),
      });
    });

    when(
      'the client fetches skills, queue, and attributes concurrently',
      async () => {
        [skills, queue, attributes] = await Promise.all([
          client.skills.getCharacterSkills(characterId),
          client.skills.getCharacterSkillQueue(characterId),
          client.skills.getCharacterAttributes(characterId),
        ]);
      },
    );

    then('all three shall return valid data', () => {
      expect(
        sentRequests()
          .map((r) => r.url.pathname)
          .sort(),
      ).toEqual([
        `/characters/${characterId}/attributes`,
        `/characters/${characterId}/skillqueue`,
        `/characters/${characterId}/skills`,
      ]);
      expect(skills.skills.map((s: any) => s.skill_id)).toEqual([3300, 3301]);
      expect(skills.total_sp).toBe(384000);
      expect(queue).toEqual(queueData);
      expect(attributes.intelligence).toBe(24);
      expect(attributes.perception).toBe(23);
    });
  });
});
