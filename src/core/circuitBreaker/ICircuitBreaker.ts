import { CircuitState } from './CircuitBreaker';

export interface ICircuitBreaker {
  checkCircuit(endpoint: string): void;
  recordSuccess(endpoint: string): void;
  recordFailure(endpoint: string, statusCode: number): void;
  getState(endpoint: string): CircuitState;
  getStats(): {
    totalCircuits: number;
    openCircuits: number;
    circuits: Record<string, { state: CircuitState; failures: number }>;
  };
  reset(endpoint?: string): void;
  cleanup(): number;
  shutdown(): void;
  /** Release resources (timers). Optional for backward compatibility. */
  destroy?(): void;
  /** Returns the configured key strategy. Optional for backward compatibility. */
  getKeyStrategy?(): 'resolved' | 'template';
}
