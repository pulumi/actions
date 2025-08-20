import { parseSemicolorToArray, stripAnsiControlCodes } from '../utils';

describe('utils.ts', () => {
  it('should parse semicolon to array', () => {

    const inputArray = parseSemicolorToArray(['hello,world']);

    expect(inputArray[0]).toBe('hello');
    expect(inputArray[1]).toBe('world');
  });
});

describe('utils.ts', () => {
  it('should parse semicolon to array', () => {

    const output = stripAnsiControlCodes('\x1b[30mblack\x1b[37mwhite');

    expect(output).toBe('blackwhite');
  });
});
