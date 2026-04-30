import { allianceEndpoints } from '../../../src/core/endpoints/allianceEndpoints';
import { assetEndpoints } from '../../../src/core/endpoints/assetEndpoints';
import { calendarEndpoints } from '../../../src/core/endpoints/calendarEndpoints';
import { characterEndpoints } from '../../../src/core/endpoints/characterEndpoints';
import { cloneEndpoints } from '../../../src/core/endpoints/cloneEndpoints';
import { contactEndpoints } from '../../../src/core/endpoints/contactEndpoints';
import { contractEndpoints } from '../../../src/core/endpoints/contractEndpoints';
import { corporationEndpoints } from '../../../src/core/endpoints/corporationEndpoints';
import { dogmaEndpoints } from '../../../src/core/endpoints/dogmaEndpoints';
import { factionEndpoints } from '../../../src/core/endpoints/factionEndpoints';
import { fittingEndpoints } from '../../../src/core/endpoints/fittingEndpoints';
import { fleetEndpoints } from '../../../src/core/endpoints/fleetEndpoints';
import { freelanceJobsEndpoints } from '../../../src/core/endpoints/freelanceJobsEndpoints';
import { incursionEndpoints } from '../../../src/core/endpoints/incursionEndpoints';
import { industryEndpoints } from '../../../src/core/endpoints/industryEndpoints';
import { insuranceEndpoints } from '../../../src/core/endpoints/insuranceEndpoints';
import { killmailEndpoints } from '../../../src/core/endpoints/killmailEndpoints';
import { locationEndpoints } from '../../../src/core/endpoints/locationEndpoints';
import { loyaltyEndpoints } from '../../../src/core/endpoints/loyaltyEndpoints';
import { mailEndpoints } from '../../../src/core/endpoints/mailEndpoints';
import { marketEndpoints } from '../../../src/core/endpoints/marketEndpoints';
import { metaEndpoints } from '../../../src/core/endpoints/metaEndpoints';
import { piEndpoints } from '../../../src/core/endpoints/piEndpoints';
import { routeEndpoints } from '../../../src/core/endpoints/routeEndpoints';
import { searchEndpoints } from '../../../src/core/endpoints/searchEndpoints';
import { skillEndpoints } from '../../../src/core/endpoints/skillEndpoints';
import { sovereigntyEndpoints } from '../../../src/core/endpoints/sovereigntyEndpoints';
import { statusEndpoints } from '../../../src/core/endpoints/statusEndpoints';
import { uiEndpoints } from '../../../src/core/endpoints/uiEndpoints';
import { universeEndpoints } from '../../../src/core/endpoints/universeEndpoints';
import { walletEndpoints } from '../../../src/core/endpoints/walletEndpoints';
import { warEndpoints } from '../../../src/core/endpoints/warEndpoints';

const ALL_ENDPOINTS: Record<string, Record<string, any>> = {
  alliance: allianceEndpoints,
  asset: assetEndpoints,
  calendar: calendarEndpoints,
  character: characterEndpoints,
  clone: cloneEndpoints,
  contact: contactEndpoints,
  contract: contractEndpoints,
  corporation: corporationEndpoints,
  dogma: dogmaEndpoints,
  faction: factionEndpoints,
  fitting: fittingEndpoints,
  fleet: fleetEndpoints,
  freelanceJobs: freelanceJobsEndpoints,
  incursion: incursionEndpoints,
  industry: industryEndpoints,
  insurance: insuranceEndpoints,
  killmail: killmailEndpoints,
  location: locationEndpoints,
  loyalty: loyaltyEndpoints,
  mail: mailEndpoints,
  market: marketEndpoints,
  meta: metaEndpoints,
  pi: piEndpoints,
  route: routeEndpoints,
  search: searchEndpoints,
  skill: skillEndpoints,
  sovereignty: sovereigntyEndpoints,
  status: statusEndpoints,
  ui: uiEndpoints,
  universe: universeEndpoints,
  wallet: walletEndpoints,
  war: warEndpoints,
};

const VALID_METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

describe('Endpoint Definitions', () => {
  for (const [groupName, endpoints] of Object.entries(ALL_ENDPOINTS)) {
    describe(`${groupName} endpoints`, () => {
      for (const [methodName, def] of Object.entries(endpoints)) {
        describe(methodName, () => {
          it('has a non-empty path', () => {
            expect(def.path).toBeTruthy();
            expect(typeof def.path).toBe('string');
          });

          it('path does not start with /', () => {
            expect(def.path[0]).not.toBe('/');
          });

          it('has a valid HTTP method', () => {
            expect(VALID_METHODS).toContain(def.method);
          });

          it('pathParams match placeholders in path', () => {
            const placeholders = (def.path.match(/\{([^}]+)\}/g) || []).map(
              (ph: string) => ph.slice(1, -1),
            );

            if (def.pathParams) {
              expect([...def.pathParams]).toEqual(placeholders);
            } else {
              expect(placeholders).toHaveLength(0);
            }
          });

          it('path placeholders use valid identifier names', () => {
            const placeholders = def.path.match(/\{([^}]+)\}/g) || [];
            for (const ph of placeholders) {
              const paramName = ph.slice(1, -1);
              expect(paramName).toMatch(/^[a-zA-Z][a-zA-Z0-9]*$/);
            }
          });

          it('path segments are lowercase', () => {
            const segments = def.path
              .replace(/\{[^}]+\}/g, '')
              .split('/')
              .filter(Boolean);
            for (const seg of segments) {
              expect(seg).toMatch(/^[a-z][a-z0-9_.-]*$/);
            }
          });

          it('GET endpoints do not have hasBody or bodyBuilder', () => {
            if (def.method === 'GET') {
              expect(def.hasBody).toBeFalsy();
              expect(def.bodyBuilder).toBeUndefined();
            }
          });

          it('queryParams values are valid query keys', () => {
            if (def.queryParams) {
              for (const [, queryKey] of Object.entries(def.queryParams)) {
                expect(queryKey).toMatch(/^[a-z][a-z0-9_]*$/);
              }
            }
          });

          it('requiresAuth is a boolean', () => {
            expect(typeof def.requiresAuth).toBe('boolean');
          });
        });
      }
    });
  }
});
