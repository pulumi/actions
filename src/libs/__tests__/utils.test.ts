import { parseSemicolorToArray } from '../utils';

describe('utils.ts', () => {
  it('should parse semicolon to array', () => {

    const inputArray = parseSemicolorToArray(['hello,world']);

    expect(inputArray[0]).toBe('hello');
    expect(inputArray[1]).toBe('world');
  });
});
