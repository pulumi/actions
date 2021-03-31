const defaultConfig: Record<string, string> = {
  command: 'up',
  'stack-name': 'dev',
  'work-dir': './',
  'cloud-url': 'file://~',
  'github-token': 'n/a',
};

describe('config.ts', () => {
  beforeEach(() => {
    jest.resetModules();
  });
  it('should validate a configuration', async () => {
    const config = {
      ...defaultConfig,
      'comment-on-pr': 'false',
    };
    jest.mock('@actions/core', () => ({
      getInput: jest.fn((name: string) => {
        return config[name];
      }),
    }));

    const { makeConfig } = require('../config');

    const c = await makeConfig();
    expect(c).toBeTruthy();
    expect(c).toEqual({
      command: 'up',
      stackName: 'dev',
      cloudUrl: 'file://~',
      githubToken: 'n/a',
      commentOnPr: false,
      workDir: './',
      upsert: undefined,
      options: {
        parallel: undefined,
        message: undefined,
        diff: undefined,
        expectNoChanges: undefined,
        replace: undefined,
        target: undefined,
        targetDependents: undefined,
        editCommentOnPr: undefined,
      },
    });
  });
  it('should fail if configuration are invalid', async () => {
    const config: Record<string, string> = {
      command: 'sideways',
    };
    jest.mock('@actions/core', () => ({
      getInput: jest.fn((name: string) => {
        return config[name];
      }),
    }));

    const { makeConfig } = require('../config');

    await expect(makeConfig()).rejects.toThrow();
  });
  it('should validate a configuration with commentOnPr eq true', async () => {
    const config = {
      ...defaultConfig,
      'comment-on-pr': 'true',
    };
    jest.mock('@actions/core', () => ({
      getInput: jest.fn((name: string) => {
        return config[name];
      }),
    }));

    const { makeConfig } = require('../config');

    const c = await makeConfig();
    expect(c).toBeTruthy();
    expect(c).toEqual({
      command: 'up',
      stackName: 'dev',
      cloudUrl: 'file://~',
      githubToken: 'n/a',
      commentOnPr: true,
      workDir: './',
      upsert: undefined,
      options: {
        parallel: undefined,
        message: undefined,
        diff: undefined,
        expectNoChanges: undefined,
        replace: undefined,
        target: undefined,
        targetDependents: undefined,
        editCommentOnPr: undefined,
      },
    });
  });
});
