/* eslint @typescript-eslint/explicit-module-boundary-types: 0 */
/* eslint @typescript-eslint/no-explicit-any: 0 */
import * as core from '@actions/core';
export function invariant(condition: any, message?: string): asserts condition {
  if (!condition) {
    core.setFailed(message);
    process.exit();
    // throw new Error();
  }
}
