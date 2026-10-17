import type { ApiClient } from '../ApiClient';
import { logWarn } from '../logger/clientLog';
import {
  EsiPaginationError,
  type EsiPaginationErrorDetails,
} from '../util/error';

/**
 * A pagination path that cannot prove it holds the whole collection calls
 * this. With `incompletePages: 'throw'` it throws the EsiPaginationError the
 * details describe. With the default, `truncate`, it logs that error's
 * message at `warn`, naming the option, and returns so the caller can go on
 * as it did before the option existed (DES-08; guides/PAGINATION.md, "Incomplete walks").
 */
export function incompleteWalk(
  client: ApiClient,
  where: string,
  details: EsiPaginationErrorDetails,
): void {
  if (client.getIncompletePages() === 'throw') {
    throw new EsiPaginationError(where, undefined, details);
  }
  // The warning needs the message, not a frozen copy of the partial result.
  const { partial, ...rest } = details;
  const summary = new EsiPaginationError(where, undefined, {
    ...rest,
    itemCount: details.itemCount ?? partial?.length ?? 0,
  });
  logWarn(
    client,
    `${summary.message}; the result may be incomplete. Set incompletePages: 'throw' to reject such a walk with an EsiPaginationError instead (the default in a future major).`,
    {
      // `page` is the key LOGGING.md documents for the empty-page warning.
      page: summary.fetchedPages,
      reason: summary.reason,
      endpoint: summary.endpoint,
      reportedPages: summary.reportedPages,
      fetchedPages: summary.fetchedPages,
      itemCount: summary.itemCount,
    },
  );
}
