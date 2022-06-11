import { parseNumber } from '../utils';

describe('utils.ts', () => {
  it('should parse number', () => {
    const truthy = '1';
    const falsy = 'false';
    const undef = '';

    expect(parseNumber(truthy)).toBe(1);
    expect(parseNumber(falsy)).toBeNaN();
    expect(parseNumber(undef)).toBeUndefined();
  });
});
