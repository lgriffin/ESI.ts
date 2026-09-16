import { MAIL_CHARACTER_ID, mailPaths } from '../../support/mail';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return labels with unread counts', function () {
  expect(lastRequest().url.pathname).toBe(mailPaths.labels(MAIL_CHARACTER_ID));
  expect(this.result.total_unread_count).toBe(5);
  expect(
    this.result.labels.map((l: any) => [l.label_id, l.name, l.unread_count]),
  ).toEqual([
    [1, '[Inbox]', 3],
    [2, '[Sent]', 0],
    [4, '[Corp]', 1],
    [8, '[Alliance]', 2],
  ]);

  // One unread message can carry several labels, so the per-label counts
  // sum to at least the total.
  const labelUnread = this.result.labels.reduce(
    (sum: number, l: any) => sum + l.unread_count,
    0,
  );
  expect(labelUnread).toBeGreaterThanOrEqual(this.result.total_unread_count);
});
