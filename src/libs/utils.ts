/* eslint @typescript-eslint/explicit-module-boundary-types: 0 */
export function invariant(
  condition: unknown,
  message?: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
