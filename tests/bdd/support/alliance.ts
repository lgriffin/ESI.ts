/**
 * What ESI's alliance endpoints send back in 0001-alliance.feature, and
 * where. Step files queue these; they do not build payloads or URLs themselves.
 */
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

export const GOONSWARM_ALLIANCE_ID = 99005338;
export const UNKNOWN_ALLIANCE_ID = 999999999;

/** Client timeout shorter than the stalled connection's delay. */
export const STALLED_TIMEOUT_MS = 20;
export const STALLED_DELAY_MS = 200;

/** Server-side delay the latency scenario pushes through the pipeline. */
export const LATENCY_DELAY_MS = 100;
export const LATENCY_BUDGET_MS = 5000;

export const alliancePaths = {
  contacts: (allianceId: number) => `/alliances/${allianceId}/contacts`,
  corporations: (allianceId: number) =>
    `/alliances/${allianceId}/corporations/`,
};

/** Matches the alliance record URL only, not its sub-resources. */
export const allianceMatches = {
  record: (allianceId: number) =>
    new RegExp(`/alliances/${allianceId}/(\\?|$)`),
};

export const allianceFixtures = {
  /** ESI does not echo alliance_id in the record body. */
  goonswarmRecord: () =>
    TestDataFactory.createAllianceInfo({
      name: 'Goonswarm Federation',
      ticker: 'CONDI',
      creator_id: 1689391488,
    }),

  record: () => TestDataFactory.createAllianceInfo(),

  tickerRecord: () => TestDataFactory.createAllianceInfo({ ticker: 'CONDI' }),

  latencyRecord: () =>
    TestDataFactory.createAllianceInfo({ name: 'Latency Alliance' }),

  characterAndCorporationContacts: () => [
    TestDataFactory.createAllianceContact({
      contact_id: 1689391488,
      contact_type: 'character',
      standing: 10.0,
    }),
    TestDataFactory.createAllianceContact({
      contact_id: 1344654522,
      contact_type: 'corporation',
      standing: 5.0,
      label_ids: [3],
    }),
  ],

  singleContact: () => [
    TestDataFactory.createAllianceContact({ contact_id: 2112625428 }),
  ],

  memberCorporationIds: () => [1344654522, 1344654523],
};
