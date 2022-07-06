const defaultConfig: Record<string, string> = {
  command: 'up',
  'stack-name': 'dev',
  'work-dir': './',
  'cloud-url': 'file://~',
  'github-token': 'n/a',
  'pulumi-version': 'latest',
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
    expect(c).toMatchInlineSnapshot(`
      Object {
        "cloudUrl": "file://~",
        "command": "up",
        "commentOnPr": false,
        "githubToken": "n/a",
        "options": Object {
          "color": undefined,
          "diff": undefined,
          "editCommentOnPr": undefined,
          "expectNoChanges": undefined,
          "message": undefined,
          "parallel": undefined,
          "policyPackConfigs": undefined,
          "policyPacks": undefined,
          "replace": undefined,
          "target": undefined,
          "targetDependents": undefined,
          "userAgent": "pulumi/actions@v3",
        },
        "refresh": undefined,
        "secretsProvider": undefined,
        "stackName": "dev",
        "upsert": undefined,
        "workDir": "./",
      }
    `);
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
    expect(c).toMatchInlineSnapshot(`
      Object {
        "cloudUrl": "file://~",
        "command": "up",
        "commentOnPr": true,
        "githubToken": "n/a",
        "options": Object {
          "color": undefined,
          "diff": undefined,
          "editCommentOnPr": undefined,
          "expectNoChanges": undefined,
          "message": undefined,
          "parallel": undefined,
          "policyPackConfigs": undefined,
          "policyPacks": undefined,
          "replace": undefined,
          "target": undefined,
          "targetDependents": undefined,
          "userAgent": "pulumi/actions@v3",
        },
        "refresh": undefined,
        "secretsProvider": undefined,
        "stackName": "dev",
        "upsert": undefined,
        "workDir": "./",
      }
    `);
  });
});
