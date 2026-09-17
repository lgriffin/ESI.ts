// Suite-health lints for tests/: npm run lint:suite-health (Testing Runway
// tier N). Not the src/ rule set: the config and its rules are defined in
// eslint.suite-health.rules.cjs, which the rules' Jest suite loads too.
import suiteHealth from './eslint.suite-health.rules.cjs';

export default suiteHealth.config;
