import * as aexec from '@actions/exec';

export interface ExecResult {
  success: boolean;
  stdout: string;
  stderr: string;
}

export const exec = async (
  command: string,
  args: string[] = [],
  silent?: boolean,
): Promise<ExecResult> => {
  const { exitCode, stdout, stderr } = await aexec.getExecOutput(command, args, {
    silent: silent,
    ignoreReturnCode: true,
  });

  return {
    success: exitCode === 0,
    stdout: stdout.trim(),
    stderr: stderr.trim(),
  };
};
