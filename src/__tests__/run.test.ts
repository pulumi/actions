import * as pulumiCli from "../libs/pulumi-cli";
import { login } from '../login';
import { runAction } from "../run";
import run from "../run";

const pulumiCliRunSpy = jest.spyOn(pulumiCli, 'run');
const previewActionSpy = jest.spyOn(run, 'previewAction');

const installConfig: Record<string, string> = {
  command: undefined,
  "pulumi-version": "^2", // test with a non-default value
};

const previewConfig: Record<string, string> = {
  command: "preview",
  stackName: 'dev',
  commentOnPr: 'false',
};

describe('Config with the `preview` command', async () => {
  let oldWorkspace = '';
  beforeEach(() => {
    previewActionSpy.mockClear();
    jest.resetModules();
    // Save, then restore the current env var for GITHUB_WORKSPACE 
    oldWorkspace = process.env.GITHUB_WORKSPACE;
    process.env.GITHUB_WORKSPACE = 'n/a';
  });
  afterEach(() => {
    process.env.GITHUB_WORKSPACE = oldWorkspace;
  });
  
  // Mock out access to githubActions Inputs with our preferred configuration.
  jest.mock("@actions/core", () => ({
    getInput: jest.fn((name: string) => {
      return previewConfig[name];
    })
  }));
  
  // Mock out other functions that are called along the way.
  jest.mock("@actions/github", () => ({
    context: {},
  }));

  // Lazy-load makeConfig so that we can load our mocks first.
  const { makeConfig } = require('../config');
  // Load the mocked config.
  const config = await makeConfig();
  expect(config).toBeTruthy();

  it('should execute `pulumi preview`', async () => {
    // Execute the core program logic, expecting our spied
    // function to have been called.
    runAction(config);
    expect(previewActionSpy).toBeCalled();
  });
})

describe('Config without a provided command', () => {
  let oldWorkspace = '';
  beforeEach(() => {
    pulumiCliRunSpy.mockClear();
    jest.resetModules();
    // Save, then restore the current env var for GITHUB_WORKSPACE 
    oldWorkspace = process.env.GITHUB_WORKSPACE;
    process.env.GITHUB_WORKSPACE = 'n/a';
  });
  afterEach(() => {
    process.env.GITHUB_WORKSPACE = oldWorkspace;
  });

  it('should not be validated by makeConfig', async () => {
    jest.mock('@actions/core', () => ({
      getInput: jest.fn((name: string) => {
        return installConfig[name];
      }),
      info: jest.fn(),
    }));
    jest.mock('@actions/github', () => ({
      context: {},
    }));
    const { makeConfig } = require('../config');
    await expect(makeConfig())
      .rejects
      .toThrow();
  });

  it('should be validated by makeInstallationConfig', async() => {
    jest.mock('@actions/core', () => ({
      getInput: jest.fn((name: string) => {
        return installConfig[name];
      }),
      info: jest.fn(),
    }));
    const { makeInstallationConfig } = require('../config');
    const conf = makeInstallationConfig()
    expect(conf.success).toBeTruthy();
    expect(conf.value).toEqual({
      command: undefined,
      pulumiVersion: "^2",
    });
  });
});

describe('main.login', () => {
  beforeEach(() => {
    pulumiCliRunSpy.mockClear();
  });
  it('should read self-hosted backend config', async () => {
    const cloudUrl = "s3://my_region.aws.com";    
    await login(cloudUrl, "");
    expect(pulumiCliRunSpy).toHaveBeenCalledTimes(1);
    expect(pulumiCliRunSpy).toHaveBeenCalledWith('--non-interactive', 'login', cloudUrl);
  })
  it('should login when an access token is provided', async () => {
    const accessToken = "my_access_token";    
    await login("", accessToken);
    expect(pulumiCliRunSpy).toHaveBeenCalledTimes(1);
    expect(pulumiCliRunSpy).toHaveBeenCalledWith('--non-interactive', 'login');
  })
  it('should not login when nothing provided', async () => {
    await login("", "");
    expect(pulumiCliRunSpy).not.toHaveBeenCalled();
  })
  it('should login with cloud url when both are specified', async () => {
    const cloudLogin = "my login url";    
    const accessToken = "my access token";    
    await login(cloudLogin, accessToken);
    expect(pulumiCliRunSpy).toHaveBeenCalledTimes(1);
    expect(pulumiCliRunSpy).toHaveBeenCalledWith('--non-interactive', 'login', cloudLogin);
  })
})