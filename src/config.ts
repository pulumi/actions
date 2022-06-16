import { getInput } from '@actions/core';
import * as rt from 'runtypes';
import { parseArray, parseBoolean, parseNumber } from './libs/utils';

export const command = rt.Union(
  rt.Literal('up'),
  rt.Literal('update'),
  rt.Literal('refresh'),
  rt.Literal('destroy'),
  rt.Literal('preview'),
);

export type Commands = rt.Static<typeof command>;

export const options = rt.Partial({
  parallel: rt.Number,
  message: rt.String,
  expectNoChanges: rt.Boolean,
  diff: rt.Boolean,
  replace: rt.Array(rt.String),
  target: rt.Array(rt.String),
  policyPacks: rt.Array(rt.String),
  policyPackConfigs: rt.Array(rt.String),
  targetDependents: rt.Boolean,
  editCommentOnPr: rt.Boolean,
  userAgent: rt.Literal('pulumi/actions@v3'),
});

export const config = rt
  .Record({
    // Required options
    command: command,
    stackName: rt.String,
    workDir: rt.String,
    commentOnPr: rt.Boolean,
    options: options,
  })
  .And(
    rt.Partial({
      // Optional options
      cloudUrl: rt.String,
      githubToken: rt.String,
      upsert: rt.Boolean,
      refresh: rt.Boolean,
      secretsProvider: rt.String,
    }),
  );

export type Config = rt.Static<typeof config>;

export async function makeConfig(): Promise<Config> {
  return config.check({
    command: getInput('command', { required: true }),
    stackName: getInput('stack-name', { required: true }),
    workDir: getInput('work-dir') || './',
    secretsProvider: getInput('secrets-provider'),
    cloudUrl: getInput('cloud-url'),
    githubToken: getInput('github-token'),
    commentOnPr: parseBoolean(getInput('comment-on-pr')),
    upsert: parseBoolean(getInput('upsert')),
    refresh: parseBoolean(getInput('refresh')),
    options: {
      parallel: parseNumber(getInput('parallel')),
      message: getInput('message'),
      expectNoChanges: parseBoolean(getInput('expect-no-changes')),
      diff: parseBoolean(getInput('diff')),
      replace: parseArray(getInput('replace')),
      target: parseArray(getInput('target')),
      targetDependents: parseBoolean(getInput('target-dependents')),
      policyPacks: parseArray(getInput('policyPacks')),
      policyPackConfigs: parseArray(getInput('policyPackConfigs')),
      editCommentOnPr: parseBoolean(getInput('edit-pr-comment')),
      userAgent: 'pulumi/actions@v3',
    },
  });
}
