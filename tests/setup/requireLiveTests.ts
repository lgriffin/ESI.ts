/**
 * Jest globalSetup for the live test tiers:
 *   - jest.integration.live.config.cjs (npm run test:integration:live)
 *   - jest.contract.live.config.cjs    (npm run contract:live)
 *
 * The live suites guard themselves with `ESI_LIVE_TESTS === 'true' ? describe
 * : describe.skip`. That is right for the default tiers, where skipping is the
 * intended behaviour, but when a live tier is asked for by name a missing
 * variable would turn every suite into a skip and the run would pass having
 * tested nothing. Asking for a live tier without enabling it is a setup error,
 * so it fails before any test file loads.
 */
export default async function requireLiveTests(): Promise<void> {
  const value = process.env.ESI_LIVE_TESTS;
  if (value === 'true') return;

  const found = value === undefined ? 'it is not set' : `it is '${value}'`;
  const script = process.env.npm_lifecycle_event ?? 'contract:live';
  throw new Error(
    [
      `A live test tier was requested, but ESI_LIVE_TESTS must be 'true' and ${found}.`,
      'Without it every live suite skips and the run would pass without testing anything.',
      '',
      'To run against live ESI:',
      `  bash:        ESI_LIVE_TESTS=true npm run ${script}`,
      `  PowerShell:  $env:ESI_LIVE_TESTS='true'; npm run ${script}`,
      '',
      'To run without the network, use the default tier instead',
      '(npm run contract, npm run test:integration), where live suites skip by design.',
    ].join('\n'),
  );
}
