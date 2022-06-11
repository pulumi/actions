import { getBooleanInput, getInput, getMultilineInput } from '@actions/core';
import { context } from '@actions/github';
import * as rt from 'runtypes';
import { parseNumber } from './libs/utils';

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

export const config = rt.Record({
  command: command,
  stackName: rt.String,
  workDir: rt.String,
  commentOnPr: rt.Boolean,
  options: options,
  configMap: rt.String.optional(),
  cloudUrl: rt.String.optional(),
  githubToken: rt.String.optional(),
  upsert: rt.Boolean.optional(),
  refresh: rt.Boolean.optional(),
  secretsProvider: rt.String.optional(),
});

export type Config = rt.Static<typeof config>;

export function makeConfig(): Config {
  return config.check({
    command: getInput('command', { required: true }),
    stackName: getInput('stack-name', { required: true }),
    workDir: getInput('work-dir'),
    secretsProvider: getInput('secrets-provider'),
    cloudUrl: getInput('cloud-url'),
    githubToken: getInput('github-token'),
    configMap: getInput('configMap'),
    isPullRequest: context?.payload?.pull_request !== undefined,
    commentOnPr: getBooleanInput('comment-on-pr', { required: true }),
    upsert: getBooleanInput('upsert', { required: true }),
    refresh: getBooleanInput('refresh', { required: true }),
    options: {
      parallel: parseNumber(getInput('parallel')),
      message: getInput('message'),
      expectNoChanges: getBooleanInput('expect-no-changes', { required: true }),
      diff: getBooleanInput('diff', { required: true }),
      replace: getMultilineInput('replace'),
      target: getMultilineInput('target'),
      targetDependents: getBooleanInput('target-dependents', {
        required: true,
      }),
      editCommentOnPr: getBooleanInput('edit-pr-comment', { required: true }),
      userAgent: 'pulumi/actions@v3',
      color: getInput('color'),
    },
  });
}
