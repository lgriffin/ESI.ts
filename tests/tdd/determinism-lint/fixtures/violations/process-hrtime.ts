export function started(): bigint {
  return process.hrtime.bigint();
}
