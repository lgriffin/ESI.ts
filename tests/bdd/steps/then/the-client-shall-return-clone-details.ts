import { CLONE_CHARACTER_ID, clonePaths } from '../../support/clones';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return clone details', function () {
  const request = lastRequest();
  expect(request.method).toBe('GET');
  expect(request.url.pathname).toBe(clonePaths.clones(CLONE_CHARACTER_ID));
  expect(request.headers['authorization']).toBe('Bearer bdd-access-token');
  expect(this.result.home_location).toEqual({
    location_id: 60003760,
    location_type: 'station',
  });
  expect(this.result.jump_clones.map((c: any) => c.jump_clone_id)).toEqual([
    12345, 12346,
  ]);
  expect(this.result.jump_clones[0].implants).toEqual([9899, 9941, 9942]);
  expect(this.result.jump_clones[1]).toEqual({
    jump_clone_id: 12346,
    location_id: 1035466617946,
    location_type: 'structure',
    implants: [],
    name: 'Staging',
  });
});
