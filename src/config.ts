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
  cloudUrl: rt.String.Or(rt.Undefined),
  githubToken: rt.String.Or(rt.Undefined),
  commentOnPr: rt.Boolean,
  args: rt.String.Or(rt.Undefined),
});

export type Config = rt.Static<typeof config>;

export async function makeConfig(): Promise<Config> {
  const [command, ...args] = getInput('command', { required: true }).split(' ');
  return config.check({
    command,
    stackName: getInput('stack-name', { required: true }),
    workDir: getInput('work-dir') || './',
    cloudUrl: getInput('cloud-url'),
    githubToken: getInput('github-token'),
    commentOnPr: getInput('comment-on-pr') === 'true' ? true : false,
    args: getInput('args') || args.join(' '),
  });
}
