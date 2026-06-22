import * as core from '@actions/core';
import { load } from 'js-yaml';

// Local replacements for `actions-parsers`, which is a CommonJS package that
// `require()`s @actions/core and therefore cannot be bundled (or tested)
// against the ESM-only @actions/core v3.

interface RequiredInput extends core.InputOptions {
  required?: true;
}
interface OptionalInput extends core.InputOptions {
  required?: false;
}

export function getInput(name: string, options?: RequiredInput): string;
export function getInput(name: string, options?: OptionalInput): string | undefined;
export function getInput(name: string, options?: core.InputOptions): string | undefined {
  return core.getInput(name, options);
}

export function getMultilineInput(name: string, options?: RequiredInput): string[];
export function getMultilineInput(
  name: string,
  options?: OptionalInput,
): string[] | undefined;
export function getMultilineInput(
  name: string,
  options?: core.InputOptions,
): string[] | undefined {
  return core.getMultilineInput(name, options);
}

export function getBooleanInput(name: string, options?: RequiredInput): boolean;
export function getBooleanInput(
  name: string,
  options?: OptionalInput,
): boolean | undefined;
export function getBooleanInput(
  name: string,
  options?: core.InputOptions,
): boolean | undefined {
  return core.getBooleanInput(name, options);
}

export function getNumberInput(name: string, options?: RequiredInput): number;
export function getNumberInput(
  name: string,
  options?: OptionalInput,
): number | undefined;
export function getNumberInput(
  name: string,
  options?: core.InputOptions,
): number | undefined {
  const value = core.getInput(name, options);
  if (!value) {
    return undefined;
  }
  const parsedValue = Number(value);
  if (Number.isNaN(parsedValue)) {
    throw new Error('Input was not a number');
  }
  return parsedValue;
}

export interface GetUnionOptions<T> extends core.InputOptions {
  alternatives: readonly T[];
}
export function getUnionInput<T>(
  name: string,
  options: RequiredInput & GetUnionOptions<T>,
): T;
export function getUnionInput<T>(
  name: string,
  options: OptionalInput & GetUnionOptions<T>,
): T | undefined;
export function getUnionInput<T>(
  name: string,
  options: GetUnionOptions<T>,
): T | undefined {
  const { alternatives, ...otherOptions } = options;
  const value = core.getInput(name, otherOptions);
  if (!value) {
    return undefined;
  }
  if (alternatives.includes(value as T)) {
    return value as T;
  }
  throw new Error(
    `Input was not correct for ${name}. Valid alternatives are: ${alternatives.join(', ')}`,
  );
}

export interface GetYAMLInputOptions<T> extends core.InputOptions {
  parser: (value: unknown) => T;
}
export function getYAMLInput<T>(
  name: string,
  options?: RequiredInput & GetYAMLInputOptions<T>,
): T;
export function getYAMLInput<T>(
  name: string,
  options?: OptionalInput & GetYAMLInputOptions<T>,
): T | undefined;
export function getYAMLInput<T>(
  name: string,
  options?: core.InputOptions & { parser?: (value: unknown) => T },
): T | undefined {
  const { parser, ...otherOptions } = options || {};
  const value = core.getInput(name, otherOptions);
  if (!value) {
    return undefined;
  }
  const output = load(value);
  if (parser) {
    return parser(output);
  }
  return output as T;
}
