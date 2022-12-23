import { parseArray, parseBoolean, parseNumber, parseYAML } from '../utils';

describe('utils.ts', () => {
  it('should parse input to array', () => {
    const input = `
      hello
      world
    `;

    const undef = '';

    const inputArray = parseArray(input);

    expect(inputArray[0]).toBe('hello');
    expect(inputArray[1]).toBe('world');
    expect(parseArray(undef)).toBeUndefined();
  });

  it('should parse boolean', () => {
    const truthy = 'true';
    const falsy = 'false';
    const falsyTypo = 'fl';
    const undef = '';

    expect(parseBoolean(truthy)).toBeTruthy();
    expect(parseBoolean(falsy)).toBeFalsy();
    expect(parseBoolean(falsyTypo)).toBeFalsy();
    expect(parseBoolean(undef)).toBeUndefined();
  });

  it('should parse number', () => {
    const truthy = '1';
    const falsy = 'false';
    const undef = '';

    expect(parseNumber(truthy)).toBe(1);
    expect(parseNumber(falsy)).toBeNaN();
    expect(parseNumber(undef)).toBeUndefined();
  });

  it('should parse YAML', () => {
    const input = `
    - key: first-key
      value: first-value
    - key: second-key
      value: second-value
      optionalValue: optional-value
    `;
    const parsed: {
      key: string;
      value: string;
      optionalValue: string;
    }[] = parseYAML(input);

    expect(parsed).toStrictEqual([
      {
        key: 'first-key',
        value: 'first-value',
      },
      {
        key: 'second-key',
        value: 'second-value',
        optionalValue: 'optional-value',
      },
    ]);
  });
});
