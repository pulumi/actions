import { jest } from '@jest/globals';

// login() calls pulumiCli.run; ESM namespaces can't be spied on, so mock the
// module and assert against the mock function directly.
const run = jest.fn();
jest.unstable_mockModule('../libs/pulumi-cli', () => ({ run }));

const { login } = await import('../login');
const spy = run;

const installConfig: Record<string, string> = {
  command: undefined,
  'pulumi-version': '^2', // test with a non-default value
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
    jest.mock('@actions/github', () => ({
      context: {},
    }));
    const { makeConfig } = await import('../config');
    await expect(() => makeConfig()).toThrow();
  });

  it('should be validated by makeInstallationConfig', async () => {
    jest.mock('@actions/core', () => ({
      getInput: jest.fn((name: string) => {
        return installConfig[name];
      }),
      getBooleanInput: jest.fn((name: string) => {
        return Boolean(installConfig[name]);
      }),
      info: jest.fn(),
    }));
    const { makeInstallationConfig } = await import('../config');
    const conf = makeInstallationConfig();
    expect(conf.success).toBeTruthy();
    if (!conf.success) {
      return;
    }
    expect(conf.value).toEqual({
      command: undefined,
      pulumiVersion: '^2',
    });
  });

  it('should read version from pulumi-version-file', async () => {
    jest.unstable_mockModule('fs', () => ({
      ...jest.requireActual<typeof import('fs')>('fs'),
      readFileSync: jest.fn((path: string) => {
        expect(path).toEqual('.pulumi.version');
        return '3.121.0';
      }),
      existsSync: jest.fn(() => {
        return true;
      }),
    }));
    jest.mock('@actions/core', () => ({
      getInput: jest.fn((name: string) => {
        switch (name) {
          case 'pulumi-version-file':
            return '.pulumi.version';
          case 'pulumi-version':
            return undefined;
        }
        return installConfig[name];
      }),
    }));

    const { makeInstallationConfig } = await import('../config');
    const conf = makeInstallationConfig();
    expect(conf.success).toBeTruthy();
    if (!conf.success) {
      return;
    }
    expect(conf.value).toEqual({
      command: undefined,
      pulumiVersion: '3.121.0',
    });
  });

  it('should fail if pulumi-version-file does not exist', async () => {
    jest.unstable_mockModule('fs', () => ({
      ...jest.requireActual<typeof import('fs')>('fs'),
      readFileSync: jest.fn((path: string) => {
        expect(path).toEqual('.pulumi.version');
        return '3.121.0';
      }),
      existsSync: jest.fn(() => {
        return false;
      }),
    }));
    jest.mock('@actions/core', () => ({
      getInput: jest.fn((name: string) => {
        switch (name) {
          case 'pulumi-version-file':
            return '.pulumi.version';
          case 'pulumi-version':
            return undefined;
        }
        return installConfig[name];
      }),
    }));

    const { makeInstallationConfig } = await import('../config');
    expect(() => {
      makeInstallationConfig();
    }).toThrow(/pulumi-version-file '\.pulumi\.version' does not exist/);
  });

  it('should fail if pulumi-version-file and pulumi-version are both provided', async () => {
    jest.unstable_mockModule('fs', () => ({
      ...jest.requireActual<typeof import('fs')>('fs'),
      readFileSync: jest.fn((path: string) => {
        expect(path).toEqual('.pulumi.version');
        return '3.121.0';
      }),
      existsSync: jest.fn(() => {
        return false;
      }),
    }));
    jest.mock('@actions/core', () => ({
      getInput: jest.fn((name: string) => {
        if (name === 'pulumi-version-file') {
          return '.pulumi.version';
        }
        return installConfig[name];
      }),
    }));

    const { makeInstallationConfig } = await import('../config');
    expect(() => {
      makeInstallationConfig();
    }).toThrow(
      /Only one of 'pulumi-version' or 'pulumi-version-file' should be provided, got both/,
    );
  });
});

describe('main.login', () => {
  beforeEach(() => {
    spy.mockClear();
  });
  it('should read self-hosted backend config', async () => {
    const cloudUrl = 's3://my_region.aws.com';
    await login('~', cloudUrl);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('--non-interactive', '--cwd', '~', 'login', cloudUrl);
  });
  it('should login when no cloud url is provided', async () => {
    await login('~', '');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('--non-interactive', '--cwd', '~', 'login');
  });
});
