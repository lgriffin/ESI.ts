import type { World } from './world';

export type StepFunction = (this: World, ...args: any[]) => unknown;

export function Given(pattern: string | RegExp, fn: StepFunction): void {
  void pattern;
  void fn;
}
export function When(pattern: string | RegExp, fn: StepFunction): void {
  void pattern;
  void fn;
}
export function Then(pattern: string | RegExp, fn: StepFunction): void {
  void pattern;
  void fn;
}
