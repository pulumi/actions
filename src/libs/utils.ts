import * as core from '@actions/core';
export function invariant(
  condition: any,
  message?: string,
): asserts condition {
  if (!condition) {
    core.setFailed(message);
    process.exit();
    // throw new Error();
  }
}
