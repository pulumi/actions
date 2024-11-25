import * as fs from 'fs'
import path from 'path'
import * as core from '@actions/core';
import { SUMMARY_ENV_VAR } from '@actions/core/lib/summary'
import { Config } from '../../config';
import { handleSummaryMessage } from '../summary';

const testDirectoryPath = path.join(__dirname, 'test')
const testFilePath = path.join(testDirectoryPath, 'test-summary.md')

async function getSummary(): Promise<string> {
  const file = await fs.promises.readFile(testFilePath, {encoding: 'utf8'});
  return file.replace(/\r\n/g, '\n');
}

const projectName = 'myFirstProject';
const defaultOptions = {
  command: 'preview',
  stackName: 'staging',
  options: {},
} as Config;

describe('summary.ts', () => {
  beforeEach(async () => {
    process.env[SUMMARY_ENV_VAR] = testFilePath;
    await fs.promises.mkdir(testDirectoryPath, {recursive: true});
    await fs.promises.writeFile(testFilePath, '', {encoding: 'utf8'});
    core.summary.emptyBuffer();
  })

  afterAll(async () => {
    await fs.promises.unlink(testFilePath);
  })

  it('throws if summary env var is undefined', async () => {
    process.env[SUMMARY_ENV_VAR] = undefined;
    const write = core.summary.addRaw('123').write();
    await expect(write).rejects.toThrow();
  })

  it('throws if summary file does not exist', async () => {
    await fs.promises.unlink(testFilePath);
    const write = core.summary.addRaw('123').write();
    await expect(write).rejects.toThrow();
  })

  it('should add only heading with empty code block to summary', async () => {
    const message = '';
    const expected = `<h1>Pulumi ${projectName}/${defaultOptions.stackName} results</h1>\n<pre lang="diff"><code></pre>\n`;

    await handleSummaryMessage(defaultOptions, projectName, message);
    const summary = await getSummary()

    expect(summary).toBe(expected);
  })

  it('should convert ansi control character to plain text and add to summary', async () => {
    const message = '\x1b[30mblack\x1b[37mwhite';
    const expected = `<h1>Pulumi ${projectName}/${defaultOptions.stackName} results</h1>\n<pre lang="diff"><code>blackwhite</code></pre>\n`;

    await handleSummaryMessage(defaultOptions, projectName, message);
    const summary = await getSummary()

    expect(summary).toBe(expected);
  })

  it('should trim the output when the output is larger than 1 MiB', async () => {
    const message = 'this is at the begining and should not be in the output' + 'a'.repeat(1_048_576) + 'this is at the end and should be in the output';

    await handleSummaryMessage(defaultOptions, projectName, message);
    const summary = await getSummary()

    expect(Buffer.byteLength(summary, 'utf8')).toBeLessThan(1_048_576);
    expect(summary).toContain('this is at the begining and should not be in the output')
    expect(summary).toContain('The output was too long and trimmed.');
    expect(summary).not.toContain('this is at the end and should be in the output');
    expect(summary).not.toContain('The output was too long and trimmed from the front.');
  })

  it('should trim the output from front when the output is larger than 1 MiB and config is set', async () => {
    const message = 'this is at the begining and should not be in the output' + 'a'.repeat(1_048_576) + 'this is at the end and should be in the output';

    const options: Config = {
      ...defaultOptions,
      alwaysIncludeSummary: true,
    };

    await handleSummaryMessage(options, projectName, message);
    const summary = await getSummary()

    expect(Buffer.byteLength(summary, 'utf8')).toBeLessThan(1_048_576);
    expect(summary).toContain('this is at the end and should be in the output');
    expect(summary).toContain('The output was too long and trimmed from the front.');
    expect(summary).not.toContain('this is at the begining and should not be in the output')
    expect(summary).not.toContain('The output was too long and trimmed.');
  })

  it('should replace first leading space with non-breaking space character to preserve the formatting', async () => {
    const message = 
`begin
      some leading spaces in this line
`;

    const expected = `<h1>Pulumi ${projectName}/${defaultOptions.stackName} results</h1>\n<pre lang="diff"><code>begin\n&nbsp;     some leading spaces in this line\n</code></pre>\n`;

    await handleSummaryMessage(defaultOptions, projectName, message);
    const summary = await getSummary()

    expect(summary).toBe(expected);
  })

})
