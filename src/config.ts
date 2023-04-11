import {
  getBooleanInput,
  getInput,
  getMultilineInput,
  getNumberInput,
  getUnionInput,
  getYAMLInput,
} from 'actions-parsers';
import * as rt from 'runtypes';
import { parseSemicolorToArray } from './libs/utils';

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
    pulumiVersion: getInput('pulumi-version') || '^3',
  });
}

const configValueRt = rt.Dictionary(
  rt.Record({
    value: rt.Union(rt.String, rt.Number, rt.Boolean, rt.Null).optional(),
    secret: rt.Boolean.optional(),
  }),
  rt.Union(rt.String, rt.Number),
);

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function makeConfig() {
  return {
    command: getUnionInput('command', {
      required: true,
      alternatives: ['up', 'update', 'refresh', 'destroy', 'preview'] as const,
    }),
    stackName: getInput('stack-name', { required: true }),
    pulumiVersion: getInput('pulumi-version', { required: true }),
    workDir: getInput('work-dir', { required: true }),
    secretsProvider: getInput('secrets-provider'),
    cloudUrl: getInput('cloud-url'),
    githubToken: getInput('github-token'),
    commentOnPr: getBooleanInput('comment-on-pr'),
    commentOnPrNumber: getNumberInput('comment-on-pr-number', {}),
    upsert: getBooleanInput('upsert'),
    remove: getBooleanInput('remove'),
    refresh: getBooleanInput('refresh'),
    configMap: getYAMLInput('config-map', {
      parser: (configMap) => configValueRt.check(configMap),
    }),
    editCommentOnPr: getBooleanInput('edit-pr-comment'),

    options: {
      parallel: getNumberInput('parallel', {}),
      message: getInput('message'),
      expectNoChanges: getBooleanInput('expect-no-changes'),
      diff: getBooleanInput('diff'),
      replace: parseSemicolorToArray(getMultilineInput('replace')),
      target: parseSemicolorToArray(getMultilineInput('target')),
      targetDependents: getBooleanInput('target-dependents'),
      policyPacks: parseSemicolorToArray(getMultilineInput('policyPacks')),
      policyPackConfigs: parseSemicolorToArray(
        getMultilineInput('policyPackConfigs'),
      ),
      userAgent: 'pulumi/actions@v3',
      color: getUnionInput('color', {
        alternatives: ['always', 'never', 'raw', 'auto'] as const,
      }),
    },
  };
}

export type Config = ReturnType<typeof makeConfig>;
export type Commands = Config['command'];
