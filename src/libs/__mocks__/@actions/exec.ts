import { ExecOptions } from '@actions/exec'

export const exec = jest.fn(
  (commandLine: string, _?: string[], options?: ExecOptions) => {
    if (commandLine === 'succeed') {
      options.listeners.stdout(Buffer.from('hello world'))
    } else {
      options.listeners.stderr(Buffer.from('hello world'))
    }
  },
)
