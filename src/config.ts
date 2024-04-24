import { ConfigMap } from '@pulumi/pulumi/automation';
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

// installationConfig is the expected Action inputs when
// the user intends to fetch a Pulumi access token using
// a Github OIDC token without
// running any other Pulumi operations.
// We expect command NOT to be provided.
export const oidcLoginConfig = rt.Record({
  command: rt.String.Or(rt.Undefined),
  cloudUrl: rt.String.Or(rt.Undefined),
  organizationName: rt.String,
  requestedTokenType: rt.String,
  scope: rt.String.Or(rt.Undefined),
  expiration: rt.Number.Or(rt.Undefined),
});

export type OidcLoginConfig = rt.Static<typeof oidcLoginConfig>;

export function makeOidcLoginConfig(): rt.Result<OidcLoginConfig> {
  return oidcLoginConfig.validate({
    command: getInput('command') || undefined,
    organizationName: getInput('oidc-pulumi-organization')|| undefined,
    scope: getInput('oidc-scope', { required: false }) || undefined,
    requestedTokenType: getInput('oidc-requested-token-type') || undefined,
    expiration: getNumberInput('oidc-token-expiration', { required: false }) || undefined,
    cloudUrl: getInput('cloud-url') || undefined,
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function makeConfig() {
  return {
    command: getUnionInput('command', {
      required: true,
      alternatives: [
        'up',
        'update',
        'refresh',
        'destroy',
        'preview',
        'output',
      ] as const,
    }),
    stackName: getInput('stack-name', { required: true }),
    pulumiVersion: getInput('pulumi-version', { required: true }),
    workDir: getInput('work-dir', { required: true }),
    secretsProvider: getInput('secrets-provider'),
    cloudUrl: getInput('cloud-url'),
    githubToken: getInput('github-token'),
    commentOnPr: getBooleanInput('comment-on-pr'),
    commentOnPrNumber: getNumberInput('comment-on-pr-number', {}),
    commentOnSummary: getBooleanInput('comment-on-summary'),
    upsert: getBooleanInput('upsert'),
    remove: getBooleanInput('remove'),
    refresh: getBooleanInput('refresh'),
    // TODO: Add parser back once pulumi/pulumi#12641 is fixed.
    // @see https://github.com/pulumi/actions/pull/913
    // @see https://github.com/pulumi/actions/pull/912
    configMap: getYAMLInput<ConfigMap>('config-map'),
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
      userAgent: 'pulumi/actions@v5',
      color: getUnionInput('color', {
        alternatives: ['always', 'never', 'raw', 'auto'] as const,
      }),
      excludeProtected: getBooleanInput('exclude-protected'),
      plan: getInput('plan'),
      suppressOutputs: getBooleanInput('suppress-outputs'),
      suppressProgress: getBooleanInput('suppress-progress'),
    },
    oidcAuthentication: {
      organizationName: getInput('oidc-pulumi-organization', {
        required: false,
      }),
      scope: getInput('oidc-scope', { required: false }),
      requestedTokenType: getInput('oidc-requested-token-type', {
        required: false,
      }),
      expiration: getNumberInput('oidc-token-expiration', { required: false }),
    },
  };
}

export type Config = ReturnType<typeof makeConfig>;
export type Commands = Config['command'];
