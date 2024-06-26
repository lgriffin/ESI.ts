import { configure } from 'jest-cucumber';

// Optional: Configure jest-cucumber settings here
configure({
  // Example setting: only run scenarios with the @focus tag
  scenarioNameTemplate: (vars) => `${vars.featureTitle} - ${vars.scenarioTitle}`,
});

console.log('Jest BDD Setup Loaded');
