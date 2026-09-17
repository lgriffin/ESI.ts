export function defer(work: () => void): void {
  setImmediate(work);
}
