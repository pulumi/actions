import { getInput } from '@actions/core';
import { context } from '@actions/github';
import * as rt from 'runtypes';
import { parseArray, parseBoolean, parseNumber } from './libs/utils';

export const command = rt.Union(
  rt.Literal('destroy'),
  rt.Literal('preview'),
  rt.Literal('refresh'),
  rt.Literal('up'),
  rt.Literal('update'),
);

export type Commands = rt.Static<typeof command>;

// installationConfig is the expected Action inputs when
// the user intends to download the Pulumi CLI without
// running any other Pulumi operations.
// We expect command NOT to be provided.
export const installationConfig = rt.Record({
  command: rt.Undefined,
  pulumiVersion: rt.String,
});

export type InstallationConfig = rt.Static<typeof installationConfig>;

export function makeInstallationConfig(): rt.Result<InstallationConfig> {
  return installationConfig.validate({
    command: getInput('command') || undefined,
    pulumiVersion: getInput('pulumi-version') || "^3",
  });
}

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
  userAgent: rt.Literal('pulumi/actions@v4'),
  pulumiVersion: rt.String,
});

export const config = rt
  .Record({
    // Required options
    command: command,
    stackName: rt.String,
    workDir: rt.String,
    commentOnPr: rt.Boolean,
    options: options,
    // Information inferred from the environment that must be present
    isPullRequest: rt.Boolean,
  })
  .And(
    rt.Partial({
      // Optional options
      cloudUrl: rt.String,
      configMap: rt.String,
      githubToken: rt.String,
      upsert: rt.Boolean,
      remove: rt.Boolean,
      refresh: rt.Boolean,
      secretsProvider: rt.String,
      commentOnPrNumber: rt.Number,
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
    commentOnPrNumber: parseNumber(getInput('comment-on-pr-number')),
    upsert: parseBoolean(getInput('upsert')),
    remove: parseBoolean(getInput('remove')),
    refresh: parseBoolean(getInput('refresh')),
    configMap: getInput('config-map'),
    isPullRequest: context?.payload?.pull_request !== undefined,
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
      userAgent: 'pulumi/actions@v4',
      pulumiVersion: getInput('pulumi-version') || "^3",
      color: getInput('color'),
    },
  });
}
