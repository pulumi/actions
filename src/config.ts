import { getInput } from '@actions/core';
import * as rt from 'runtypes';

export const command = rt.Union(
  rt.Literal('up'),
  rt.Literal('refresh'),
  rt.Literal('destroy'),
  rt.Literal('preview'),
);

export type Commands = rt.Static<typeof command>;

export const config = rt.Record({
  command: command,
  stackName: rt.String,
  workDir: rt.String,
});

export type Config = rt.Static<typeof config>;

export async function makeConfig(): Promise<Config> {
  return config.check({
    command: getInput('command', { required: true }),
    stackName: getInput('stack-name', { required: true }),
    workDir: getInput('work-dir') || './',
  });
}
