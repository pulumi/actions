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
      getBooleanInput: jest.fn((name: string) => {
        return Boolean(config[name] === 'true');
      }),
      getMultilineInput: jest.fn((name: string) => {
        return config[name] ? config[name].split(/\r?\n/) : undefined;
      }),
    }));
    jest.mock('@actions/github', () => ({
      context: {},
    }));

    const { makeConfig } = require('../config');

    const c = makeConfig();
    expect(c).toBeTruthy();
    expect(c).toMatchInlineSnapshot(`
      Object {
        "cloudUrl": "file://~",
        "command": "up",
        "commentOnPr": false,
        "configMap": undefined,
        "githubToken": "n/a",
        "isPullRequest": false,
        "options": Object {
          "color": undefined,
          "diff": false,
          "editCommentOnPr": false,
          "expectNoChanges": false,
          "message": undefined,
          "parallel": undefined,
          "replace": undefined,
          "target": undefined,
          "targetDependents": false,
          "userAgent": "pulumi/actions@v3",
        },
        "refresh": false,
        "secretsProvider": undefined,
        "stackName": "dev",
        "upsert": false,
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
      getBooleanInput: jest.fn((name: string) => {
        return Boolean(config[name] === 'true');
      }),
      getMultilineInput: jest.fn((name: string) => {
        return config[name] ? config[name].split(/\r?\n/) : undefined;
      }),
    }));
    jest.mock('@actions/github', () => ({
      context: {},
    }));

    const { makeConfig } = require('../config');

    await expect(makeConfig).toThrowErrorMatchingInlineSnapshot(
      `"Expected { command: \\"up\\" | \\"update\\" | \\"refresh\\" | \\"destroy\\" | \\"preview\\"; stackName: string; workDir: string; commentOnPr: boolean; options: { parallel?: number; message?: string; expectNoChanges?: boolean; diff?: boolean; replace?: string[]; target?: string[]; policyPacks?: string[]; policyPackConfigs?: string[]; targetDependents?: boolean; editCommentOnPr?: boolean; userAgent?: \\"pulumi/actions@v3\\"; }; isPullRequest: boolean; configMap?: string; cloudUrl?: string; githubToken?: string; upsert?: boolean; refresh?: boolean; secretsProvider?: string; }, but was incompatible"`,
    );
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
      getBooleanInput: jest.fn((name: string) => {
        return Boolean(config[name] === 'true');
      }),
      getMultilineInput: jest.fn((name: string) => {
        return config[name] ? config[name].split(/\r?\n/) : undefined;
      }),
    }));

    const { makeConfig } = require('../config');

    const c = makeConfig();
    expect(c).toBeTruthy();
    expect(c).toMatchInlineSnapshot(`
      Object {
        "cloudUrl": "file://~",
        "command": "up",
        "commentOnPr": true,
        "configMap": undefined,
        "githubToken": "n/a",
        "isPullRequest": false,
        "options": Object {
          "color": undefined,
          "diff": false,
          "editCommentOnPr": false,
          "expectNoChanges": false,
          "message": undefined,
          "parallel": undefined,
          "replace": undefined,
          "target": undefined,
          "targetDependents": false,
          "userAgent": "pulumi/actions@v3",
        },
        "refresh": false,
        "secretsProvider": undefined,
        "stackName": "dev",
        "upsert": false,
        "workDir": "./",
      }
    `);
  });
  it('should determine when in a PR', async () => {
    const config = {
      ...defaultConfig,
      'comment-on-pr': 'false',
    };
    jest.mock('@actions/core', () => ({
      getInput: jest.fn((name: string) => {
        return config[name];
      }),
      getBooleanInput: jest.fn((name: string) => {
        return Boolean(config[name] === 'true');
      }),
      getMultilineInput: jest.fn((name: string) => {
        return config[name] ? config[name].split(/\r?\n/) : undefined;
      }),
    }));
    jest.mock('@actions/github', () => ({
      context: {
        payload: {
          pull_request: {
            number: 5678,
          },
        },
      },
    }));

    const { makeConfig } = require('../config');

    const c = await makeConfig();
    expect(c).toBeTruthy();
    expect(c).toMatchInlineSnapshot(`
      Object {
        "cloudUrl": "file://~",
        "command": "up",
        "commentOnPr": false,
        "configMap": undefined,
        "githubToken": "n/a",
        "isPullRequest": true,
        "options": Object {
          "color": undefined,
          "diff": false,
          "editCommentOnPr": false,
          "expectNoChanges": false,
          "message": undefined,
          "parallel": undefined,
          "replace": undefined,
          "target": undefined,
          "targetDependents": false,
          "userAgent": "pulumi/actions@v3",
        },
        "refresh": false,
        "secretsProvider": undefined,
        "stackName": "dev",
        "upsert": false,
        "workDir": "./",
      }
    `);
  });
});
