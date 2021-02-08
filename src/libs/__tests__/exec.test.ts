import * as aexec from '@actions/exec';
import { exec } from '../exec';

describe('exec.ts', () => {
  it('should return stdout', async () => {
      const r = await exec('succeed');

      expect(r.stdout).toBe('hello world');
      expect(aexec.exec).toHaveBeenCalled();
  })
  it('should return stderr', async () => {
    const r = await exec('fail');

    expect(r.stderr).toBe('hello world');
    expect(aexec.exec).toHaveBeenCalled();
  });
})
