/**
 * The warning a call to a deprecated ESI route logs, shared by both surfaces
 * so they word it the same way: the custom clients (`createClient`, from an
 * endpoint definition's `DeprecationInfo`) and the generated operations
 * (`PipelineTransport`, from `OperationMeta.deprecation`).
 */
import type { ApiClient } from '../ApiClient';
import type { LogContext } from '../logger/ILogger';
import { logWarn } from '../logger/clientLog';

/** Migration guidance: `DeprecationInfo` and `OperationDeprecation` both fit. */
export interface DeprecationGuidance {
  readonly message?: string;
  readonly replacedBy?: string;
  readonly sunsetDate?: string;
}

/**
 * `<Kind> '<name>' is deprecated. <message> Use '<replacedBy>' instead.
 * Sunset date: <sunsetDate>.`, leaving out each piece of guidance that is
 * missing or empty.
 */
export function deprecationWarning(
  kind: 'Endpoint' | 'Operation',
  name: string,
  guidance: DeprecationGuidance,
): string {
  const parts = [`${kind} '${name}' is deprecated.`];
  if (guidance.message) parts.push(guidance.message);
  if (guidance.replacedBy) parts.push(`Use '${guidance.replacedBy}' instead.`);
  if (guidance.sunsetDate) parts.push(`Sunset date: ${guidance.sunsetDate}.`);
  return parts.join(' ');
}

/**
 * Logs `deprecationWarning` through the client's logger at warn level, once
 * per call, when `guidance` is given; does nothing when it is `undefined`.
 */
export function warnIfDeprecated(
  client: ApiClient,
  kind: 'Endpoint' | 'Operation',
  name: string,
  guidance: DeprecationGuidance | undefined,
  context: LogContext,
): void {
  if (!guidance) return;
  logWarn(client, deprecationWarning(kind, name, guidance), context);
}
