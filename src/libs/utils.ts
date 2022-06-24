/* eslint @typescript-eslint/explicit-module-boundary-types: 0 */
export function invariant(
  condition: unknown,
  message?: string,
): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

export function parseArray(input: string): string[] {
  return parseUndefined(input)
    ? input.split(/\r?\n/).reduce<string[]>(
      (acc, line) =>
        acc
          .concat(line.split(','))
          .filter(pat => pat)
          .map(pat => pat.trim()),
      [],
    )
    : undefined
}

export function parseUndefined(input: string): string | undefined {
  return input === undefined || input === '' ? undefined : input
}

export function parseBoolean(input: string): boolean | undefined {
  return parseUndefined(input) ? input === 'true' : undefined
}

export function parseNumber(input: string): number | undefined {
  return parseUndefined(input) ? Number(input) : undefined
}
