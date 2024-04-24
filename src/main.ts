import { join, resolve } from 'path';
import * as core from '@actions/core';
import { context } from '@actions/github';
import {
  LocalProgramArgs,
  LocalWorkspace,
  LocalWorkspaceOptions,
} from '@pulumi/pulumi/automation';
import axios from 'axios';
import invariant from 'ts-invariant';
import {
  Commands,
  Config,
  InstallationConfig,
  OidcLoginConfig,
  makeConfig,
  makeInstallationConfig,
  makeOidcLoginConfig,
} from './config';
import { environmentVariables } from './libs/envs';
import { handlePullRequestMessage } from './libs/pr';
import * as pulumiCli from './libs/pulumi-cli';
import { login } from './login';

const main = async () => {
  const downloadConfig = makeInstallationConfig();
  if (downloadConfig.success) {
    await installOnly(downloadConfig.value);
    core.info('Pulumi has been successfully installed.');
  }

  const oidcConfig = makeOidcLoginConfig();
  if (oidcConfig.success) {
    await ensureAccessToken(oidcConfig.value);
    core.setSecret(process.env['PULUMI_ACCESS_TOKEN'])
    core.setOutput("pulumi-access-token", process.env['PULUMI_ACCESS_TOKEN'])
    core.info('OIDC token exchange performed successfully.');
  }

  if (downloadConfig.success || (oidcConfig.success && oidcConfig.value.command === undefined)) {
    core.info('Exiting.');
    return;
  }
  
  // If we get here, we're not in install-only mode.
  // Attempt to parse the full configuration and run the action.
  const config = await makeConfig();
  core.debug('Configuration is loaded');

  runAction(config);
};

// installOnly is the main entrypoint of the program when the user
// intends to install the Pulumi CLI without running additional commands.
const installOnly = async (config: InstallationConfig): Promise<void> => {
  await pulumiCli.downloadCli(config.pulumiVersion);
};

const ensureAccessToken = async (config: OidcLoginConfig): Promise<void> => {
  const pulumiToken = process.env['PULUMI_ACCESS_TOKEN'];
  if (!pulumiToken && !!config.organizationName) {
    const audience = `urn:pulumi:org:${config.organizationName}`;
    core.debug(`Fetching OIDC Token for ${audience}`);

    const id_token = await core.getIDToken(audience);

    core.debug(`Exchanging oidc token for pulumi token`);
    const access_token = await exchangeIdToken(config, audience, id_token);

    process.env['PULUMI_ACCESS_TOKEN'] = access_token;
  }
};

const exchangeIdToken = async (
  config: OidcLoginConfig,
  audience: string,
  subjectToken: string,
): Promise<string> => {
  const base =
    !config.cloudUrl ? 'https://api.pulumi.com' : config.cloudUrl;
  const url = join(base, 'api', 'oauth', 'token');

  const body = {
    audience: audience,
    grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
    subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
    requested_token_type: config.requestedTokenType,
    subject_token: subjectToken,
  };

  if (config.expiration) {
    body["expiration"] = config.expiration;
  }
  if (config.scope) {
    body["scope"] = config.scope;
  }

  try {
    const res = await axios.post(url, body);

    return res.data.access_token;
  } catch (error) {
    const res = error.response;
    core.debug(error);

    throw new Error(
      `Invalid response from token exchange ${res.status}: ${res.statusText} (${res.data.error}: ${res.data.message})`,
    );
  }
};

const runAction = async (config: Config): Promise<void> => {
  await pulumiCli.downloadCli(config.pulumiVersion);
  const result = await login(config.cloudUrl);
  if (!result.success) {
    core.warning(`Failed to login to Pulumi service: ${result.stderr}`);
  }

  const workDir = resolve(
    environmentVariables.GITHUB_WORKSPACE,
    config.workDir,
  );
  core.debug(`Working directory resolved at ${workDir}`);

  const stackArgs: LocalProgramArgs = {
    stackName: config.stackName,
    workDir: workDir,
  };

  const stackOpts: LocalWorkspaceOptions = {};
  if (config.secretsProvider != '') {
    stackOpts.secretsProvider = config.secretsProvider;
  }

  const stack = await (config.upsert
    ? LocalWorkspace.createOrSelectStack(stackArgs, stackOpts)
    : LocalWorkspace.selectStack(stackArgs, stackOpts));

  const projectSettings = await stack.workspace.projectSettings();
  const projectName = projectSettings.name;

  const onOutput = (msg: string) => {
    core.debug(msg);
    core.info(msg);
  };

  if (config.configMap) {
    await stack.setAllConfig(config.configMap);
  }

  if (config.refresh) {
    core.startGroup(`Refresh stack on ${config.stackName}`);
    await stack.refresh({ onOutput });
    core.endGroup();
  }

  core.startGroup(`pulumi ${config.command} on ${config.stackName}`);

  const actions: Record<Commands, () => Promise<string>> = {
    up: () => stack.up({ onOutput, ...config.options }).then((r) => r.stdout),
    update: () =>
      stack.up({ onOutput, ...config.options }).then((r) => r.stdout),
    refresh: () =>
      stack.refresh({ onOutput, ...config.options }).then((r) => r.stdout),
    destroy: () =>
      stack.destroy({ onOutput, ...config.options }).then((r) => r.stdout),
    preview: async () => {
      const { stdout, stderr } = await stack.preview(config.options);
      onOutput(stdout);
      onOutput(stderr);
      return stdout;
    },
    output: () => new Promise(() => ''), //do nothing, outputs are fetched anyway afterwards
  };

  core.debug(`Running action ${config.command}`);
  const output = await actions[config.command]();
  core.debug(`Done running action ${config.command}`);

  core.setOutput('output', output);

  const outputs = await stack.outputs();

  for (const [outKey, outExport] of Object.entries(outputs)) {
    core.setOutput(outKey, outExport.value);
    if (outExport.secret) {
      core.setSecret(outExport.value);
    }
  }

  if (config.commentOnPrNumber || config.commentOnPr) {
    const isPullRequest = context.payload.pull_request !== undefined;
    if (isPullRequest) {
      core.debug(`Commenting on pull request`);
      invariant(config.githubToken, 'github-token is missing.');
      handlePullRequestMessage(config, projectName, output);
    }
  }

  if (config.commentOnSummary) {
    await core.summary
      .addHeading(`Pulumi ${config.stackName} results`)
      .addCodeBlock(output, 'diff')
      .write();
  }

  if (config.remove && config.command === 'destroy') {
    stack.workspace.removeStack(stack.name);
  }

  core.endGroup();
};

(async () => {
  try {
    await main();
  } catch (err) {
    if (err.message.stderr) {
      core.setFailed(err.message.stderr);
    } else {
      core.setFailed(err.message);
    }
  }
})();
