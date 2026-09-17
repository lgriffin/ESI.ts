export function defer(work: () => void): void {
  queueMicrotask(work);
}
