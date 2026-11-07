import { project } from '../../support/custom-endpoints';
import { Then } from '../../support/steps';

Then(
  'the {word} result shall hold the projects {string} and the response metadata',
  function (view: string, ids: string) {
    expect(this.error).toBeUndefined();
    const result = this.result as Record<string, unknown>;
    if (view === 'safe') expect(result.ok).toBe(true);
    else expect(result).not.toHaveProperty('ok');
    expect(result.data).toEqual({
      data: ids.split(', ').map(project),
      cursors: { before: 'prev', after: 'next' },
    });
    expect(result.meta).toMatchObject({
      fromCache: false,
      headers: expect.objectContaining({ 'x-cursor-after': 'next' }),
    });
  },
);
