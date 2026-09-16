import {
  REPORT_KILLMAIL,
  killmailFixtures,
  killmailPaths,
} from '../../support/killmails';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return the complete kill report', function () {
  expect(lastRequest().url.pathname).toMatch(
    new RegExp(`${killmailPaths.detail(REPORT_KILLMAIL)}/?$`),
  );
  expect(this.result.killmail_id).toBe(REPORT_KILLMAIL.id);
  expect(this.result.killmail_time).toBe('2024-01-15T12:30:00Z');
  expect(this.result.solar_system_id).toBe(30000142);
  expect(this.result.victim).toEqual(killmailFixtures.reportVictim());
  expect(this.result.attackers).toEqual(killmailFixtures.reportAttackers());
});
