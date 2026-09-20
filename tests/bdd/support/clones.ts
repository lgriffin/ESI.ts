/**
 * What ESI's clone and implant endpoints send back in 0007-clones.feature,
 * and where. Step files queue these; they do not build payloads or URLs
 * themselves.
 */

export const CLONE_CHARACTER_ID = 90000001;

export const clonePaths = {
  clones: (characterId: number) => `/characters/${characterId}/clones`,
  implants: (characterId: number) => `/characters/${characterId}/implants`,
};

export const cloneFixtures = {
  /** A home station, a stocked jump clone and an empty named one. */
  cloneRecord: () => ({
    home_location: {
      location_id: 60003760,
      location_type: 'station',
    },
    jump_clones: [
      {
        jump_clone_id: 12345,
        location_id: 60003760,
        location_type: 'station',
        implants: [9899, 9941, 9942],
      },
      {
        jump_clone_id: 12346,
        location_id: 1035466617946,
        location_type: 'structure',
        implants: [],
        name: 'Staging',
      },
    ],
    last_clone_jump_date: '2024-01-15T12:00:00Z',
    last_station_change_date: '2024-01-10T08:00:00Z',
  }),

  /** Jump clones whose implants differ from the active set below. */
  stockedCloneRecord: () => ({
    home_location: { location_id: 60003760, location_type: 'station' },
    jump_clones: [
      {
        jump_clone_id: 12345,
        location_id: 60003760,
        location_type: 'station',
        implants: [9899, 9941],
      },
      {
        jump_clone_id: 12346,
        location_id: 60008494,
        location_type: 'station',
        implants: [9942],
      },
    ],
  }),

  fiveImplants: () => [9899, 9941, 9942, 9943, 9956],

  activeImplants: () => [9943, 9956],
};
