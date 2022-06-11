export function parseUndefined(input: string): string | undefined {
  return input === undefined || input === '' ? undefined : input;
}
export function parseNumber(input: string): number | undefined {
  return parseUndefined(input) ? Number(input) : undefined;
}
