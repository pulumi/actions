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
  cwd: rt.String,
  githubToken: rt.String.Or(rt.Undefined),
  commentOnPr: rt.Boolean,
});

export type Config = rt.Static<typeof config>;

export async function makeConfig(): Promise<Config> {
  return config.check({
    command: getInput('command', { required: true }),
    stackName: getInput('stack-name', { required: true }),
    cwd: getInput('cwd') || './',
    githubToken: getInput('github-token'),
    commentOnPr: getInput('comment-on-pr') ? true : false,
  });
}
