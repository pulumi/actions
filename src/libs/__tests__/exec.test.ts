import { jest } from '@jest/globals';

const getExecOutput = jest.fn(
  (commandLine: string, _?: string[], options?: { silent?: boolean }) => {
    let stdout = 'hello world';
    let stderr = '';
    let exitCode = 0;
    if (commandLine !== 'succeed') {
      stdout = '';
      stderr = 'hello world';
      exitCode = 1;
    }
    if (options?.silent) {
      stdout = '';
      stderr = '';
    }
    return { stdout, stderr, exitCode };
  },
);
jest.unstable_mockModule('@actions/exec', () => ({ getExecOutput }));

const aexec = await import('@actions/exec');
const { exec } = await import('../exec');

describe('exec.ts', () => {
  it('should return stdout', async () => {
    const r = await exec('succeed');
    expect(r.stdout).toBe('hello world');
    expect(aexec.getExecOutput).toHaveBeenCalled();
  });
  it('should return stderr', async () => {
    const r = await exec('fail');
    expect(r.stderr).toBe('hello world');
    expect(aexec.getExecOutput).toHaveBeenCalled();
  });
});
