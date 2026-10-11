import {
  BranchResponse,
  ProtectionResponse,
  REQUIRED_CHECK,
  protectionNotes,
  protectionProblems,
} from '../../../scripts/quality/branch-protection-core';

const protectedBranch: BranchResponse = {
  protected: true,
  protection: {
    enabled: true,
    required_status_checks: {
      enforcement_level: 'non_admins',
      contexts: [REQUIRED_CHECK],
      checks: [{ context: REQUIRED_CHECK }],
    },
  },
};

const adminView: ProtectionResponse = {
  required_pull_request_reviews: { required_approving_review_count: 0 },
  required_status_checks: { strict: true, contexts: [REQUIRED_CHECK] },
  allow_force_pushes: { enabled: false },
};

describe('PROC-03: master accepts changes only through a pull request that passes ci-success', () => {
  it('passes the protection master has today', () => {
    expect(protectionProblems(protectedBranch, adminView)).toEqual([]);
  });

  it('passes on the read-only view when no admin token is available', () => {
    expect(protectionProblems(protectedBranch, null)).toEqual([]);
  });

  it('fails when master is not protected', () => {
    expect(protectionProblems({ protected: false }, null)).toEqual([
      'master is not a protected branch',
    ]);
  });

  it('fails when ci-success is no longer a required check', () => {
    const branch: BranchResponse = {
      protected: true,
      protection: {
        enabled: true,
        required_status_checks: { contexts: ['Lint & Build'], checks: [] },
      },
    };
    expect(protectionProblems(branch, null)).toEqual([
      `${REQUIRED_CHECK} is not a required status check`,
    ]);
  });

  it('accepts ci-success named only in checks, the newer field', () => {
    const branch: BranchResponse = {
      protected: true,
      protection: {
        enabled: true,
        required_status_checks: { checks: [{ context: REQUIRED_CHECK }] },
      },
    };
    expect(protectionProblems(branch, null)).toEqual([]);
  });

  it('fails when required checks are switched off', () => {
    const branch: BranchResponse = {
      protected: true,
      protection: {
        enabled: true,
        required_status_checks: {
          enforcement_level: 'off',
          contexts: [REQUIRED_CHECK],
        },
      },
    };
    expect(protectionProblems(branch, null)).toEqual([
      'required status checks are switched off',
    ]);
  });

  it('fails, given an admin view, when a stale branch may merge or force pushes are allowed', () => {
    expect(
      protectionProblems(protectedBranch, {
        required_pull_request_reviews: {},
        required_status_checks: { strict: false },
        allow_force_pushes: { enabled: true },
      }),
    ).toEqual([
      'a pull request need not be up to date with master',
      'force pushes to master are allowed',
    ]);
  });

  it('fails, given an admin view, when master does not require a pull request', () => {
    expect(
      protectionProblems(protectedBranch, {
        ...adminView,
        required_pull_request_reviews: null,
      }),
    ).toEqual(['master does not require a pull request']);
  });
});

describe('PROC-03: what the weekly check reports but does not fail on', () => {
  it('says what it could not read without an admin token', () => {
    expect(protectionNotes(protectedBranch, null)).toEqual([
      expect.stringContaining('not checked: the pull-request requirement'),
      expect.stringContaining('administrators are exempt'),
    ]);
  });

  it('notes the administrator exemption, which SEC-07 tracks', () => {
    expect(protectionNotes(protectedBranch, adminView)).toEqual([
      expect.stringContaining('SEC-07'),
    ]);
  });

  it('has nothing to note when administrators are included and the admin view was read', () => {
    const branch: BranchResponse = {
      protected: true,
      protection: {
        enabled: true,
        required_status_checks: {
          enforcement_level: 'everyone',
          contexts: [REQUIRED_CHECK],
        },
      },
    };
    expect(protectionNotes(branch, adminView)).toEqual([]);
  });
});
