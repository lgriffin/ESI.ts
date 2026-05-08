export interface EsiCursor {
  before: string | null;
  after: string | null;
}

export interface FreelanceJobSummary {
  id: string;
  name: string;
  state: string;
  last_modified: string;
  progress: {
    current: number;
    desired: number;
  };
  reward?: {
    initial: number;
    remaining: number;
  };
}

export interface FreelanceJobsListing {
  cursor: EsiCursor;
  freelance_jobs: FreelanceJobSummary[];
}

export interface FreelanceJobDetail {
  id: string;
  name: string;
  state: string;
  last_modified: string;
  progress: {
    current: number;
    desired: number;
  };
  reward?: {
    initial: number;
    remaining: number;
  };
  details: {
    description: string;
    career: string;
    created: string;
    expires: string;
    creator: {
      character: { id: number; name: string };
      corporation: { id: number; name: string };
    };
  };
  configuration: {
    version: number;
    parameters: Record<string, unknown>;
    method: string;
  };
  contribution: {
    max_committed_participants: number;
    reward_per_contribution: number;
    submission_multiplier: number;
  };
  access_and_visibility: {
    acl_protected: boolean;
    broadcast_locations: { id: number; name: string }[];
  };
}

export interface CharacterFreelanceJobsListing {
  cursor: EsiCursor;
  freelance_jobs: FreelanceJobSummary[];
}

export interface FreelanceJobParticipation {
  job_id: string;
  character_id: number;
  status: string;
  contributions: number;
  last_contribution?: string;
}

export interface CorporationFreelanceJobsListing {
  cursor: EsiCursor;
  freelance_jobs: FreelanceJobSummary[];
}

export interface FreelanceJobParticipant {
  character_id: number;
  corporation_id: number;
  status: string;
  contributions: number;
  last_contribution?: string;
}
