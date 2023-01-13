import * as pulumiCli from "../libs/pulumi-cli";
import { login } from '../login';

const spy = jest.spyOn(pulumiCli, 'run');

const installConfig: Record<string, string> = {
  command: undefined,
  pulumiVersion: "^4",
};

describe('Config without a provided command', () => {
  let oldWorkspace = '';
  beforeEach(() => {
    spy.mockClear();
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
    const conf = await makeInstallationConfig()
    expect(conf).toBeTruthy();
  });
});

describe('main.login', () => {
  beforeEach(() => {
    spy.mockClear();
  });
  it('should read self-hosted backend config', async () => {
    const cloudUrl = "s3://my_region.aws.com";    
    await login(cloudUrl, "");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('--non-interactive', 'login', cloudUrl);
  })
  it('should login when an access token is provided', async () => {
    const accessToken = "my_access_token";    
    await login("", accessToken);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('--non-interactive', 'login');
  })
  it('should not login when nothing provided', async () => {
    await login("", "");
    expect(spy).not.toHaveBeenCalled();
  })
  it('should login with cloud url when both are specified', async () => {
    const cloudLogin = "my login url";    
    const accessToken = "my access token";    
    await login(cloudLogin, accessToken);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('--non-interactive', 'login', cloudLogin);
  })
})