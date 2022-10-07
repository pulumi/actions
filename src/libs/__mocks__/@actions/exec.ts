import { ExecOptions } from '@actions/exec';

export const getExecOutput = jest.fn(
  (commandLine: string, _?: string[], options?: ExecOptions) => {
    let stdout = 'hello world';
    let stderr = '';
    let exitCode = 0;
    if(commandLine !== 'succeed') {
      stdout = '';
      stderr = 'hello world';
      exitCode = 1;
    }
    if (options.silent) {
      stdout = '';
      stderr = '';
    }
    return { stdout, stderr, exitCode };
  },
);
