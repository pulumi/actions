import { makeConfig } from '../config';

const defaultConfig: Record<string, string> = {
  command: 'up',
  'stack-name': 'dev',
  'work-dir': './',
  'cloud-url': 'file://~',
  'github-token': 'n/a',
  'pulumi-version': '^3',
  'comment-on-pr': 'false',
  'comment-on-summary': 'false',
  'comment-max-character': '64000',
  upsert: 'false',
  remove: 'false',
  refresh: 'false',
  'edit-pr-comment': 'false',
  'expect-no-changes': 'false',
  diff: 'false',
  'target-dependents': 'false',
  'exclude-protected': 'false',
  plan: '',
  'suppress-outputs': 'false',
  'suppress-progress': 'false',
};

function setupMockedConfig(config: Record<string, string>) {
  Object.entries(config).forEach(([key, value]) => {
    process.env[`INPUT_${key.replace(/ /g, '_').toUpperCase()}`] = value;
  });
}

describe('config.ts', () => {
  beforeEach(() => {
    jest.resetModules();
  });
  it('should validate a configuration', async () => {
    setupMockedConfig(defaultConfig);
    const c = makeConfig();

    expect(c).toBeTruthy();
    expect(c).toMatchInlineSnapshot(`
      Object {
        "cloudUrl": "file://~",
        "command": "up",
        "commentMaxCharacter": 64000,
        "commentOnPr": false,
        "commentOnPrNumber": undefined,
        "commentOnSummary": false,
        "configMap": undefined,
        "editCommentOnPr": false,
        "githubToken": "n/a",
        "options": Object {
          "color": undefined,
          "diff": false,
          "excludeProtected": false,
          "expectNoChanges": false,
          "message": "",
          "parallel": undefined,
          "plan": "",
          "policyPackConfigs": Array [],
          "policyPacks": Array [],
          "replace": Array [],
          "suppressOutputs": false,
          "suppressProgress": false,
          "target": Array [],
          "targetDependents": false,
          "userAgent": "pulumi/actions@v5",
        },
        "pulumiVersion": "^3",
        "refresh": false,
        "remove": false,
        "secretsProvider": "",
        "stackName": "dev",
        "upsert": false,
        "workDir": "./",
      }
    `);
  });
  it('should fail if configuration are invalid', async () => {
    setupMockedConfig({
      ...defaultConfig,
      'stack-name': '',
      command: 'invalid',
    });

    expect(() => makeConfig()).toThrowErrorMatchingInlineSnapshot(
      `"Input was not correct for command. Valid alternatives are: up, update, refresh, destroy, preview, output"`,
    );
  });

  it('should return ^3 if pulumi-version is undefined', async () => {
    jest.mock('@actions/core', () => ({
      getInput: jest.fn((name: string) => {
        switch (name) {
          case 'pulumi-version':
            return undefined;
        }
        return defaultConfig[name];
      }),
      getBooleanInput: jest.fn((name: string) => {
        return defaultConfig[name];
      }),
      getMultilineInput: jest.fn((name: string) => {
        return defaultConfig[name];
      }),
    }));
    const { makeConfig } = require('../config');
    const conf = makeConfig();
    expect(conf.pulumiVersion).toEqual('^3');
  });

  it('should read version from pulumi-version-file', async () => {
    jest.mock('@actions/core', () => ({
      getInput: jest.fn((name: string) => {
        switch (name) {
          case 'pulumi-version-file':
            return '.pulumi.version';
          case 'pulumi-version':
            return undefined;
        }
        return defaultConfig[name];
      }),
      getBooleanInput: jest.fn((name: string) => {
        return defaultConfig[name];
      }),
      getMultilineInput: jest.fn((name: string) => {
        return defaultConfig[name];
      }),
    }));
    jest.mock('fs', () => ({
      ...jest.requireActual('fs'),
      readFileSync: jest.fn((path: string) => {
        expect(path).toEqual('.pulumi.version');
        return '3.121.0';
      }),
      existsSync: jest.fn(() => {
        return true;
      }),
    }));
    const { makeConfig } = require('../config');
    const conf = makeConfig();
    expect(conf.pulumiVersion).toEqual('3.121.0');
  });

  it('should fail if pulumi-version-file does not exist', async () => {
    jest.mock('@actions/core', () => ({
      getInput: jest.fn((name: string) => {
        switch (name) {
          case 'pulumi-version-file':
            return '.pulumi.version';
          case 'pulumi-version':
            return undefined;
        }
        return defaultConfig[name];
      }),
    }));
    jest.mock('fs', () => ({
      ...jest.requireActual('fs'),
      readFileSync: jest.fn((path: string) => {
        expect(path).toEqual('.pulumi.version');
        return '3.121.0';
      }),
      existsSync: jest.fn(() => {
        return false;
      }),
    }));
    const { makeConfig } = require('../config');
    expect(() => {
      makeConfig();
    }).toThrow(/pulumi-version-file '\.pulumi\.version' does not exist/);
  });

  it('should fail if pulumi-version-file and pulumi-version are both provided', async () => {
    jest.mock('@actions/core', () => ({
      getInput: jest.fn((name: string) => {
        switch (name) {
          case 'pulumi-version-file':
            return '.pulumi.version';
          case 'pulumi-version':
            return '^3';
        }
        return defaultConfig[name];
      }),
    }));
    jest.mock('fs', () => ({
      ...jest.requireActual('fs'),
      readFileSync: jest.fn((path: string) => {
        expect(path).toEqual('.pulumi.version');
        return '3.121.0';
      }),
      existsSync: jest.fn(() => {
        return false;
      }),
    }));
    const { makeConfig } = require('../config');
    expect(() => {
      makeConfig();
    }).toThrow(
      /Only one of 'pulumi-version' or 'pulumi-version-file' should be provided, got both/,
    );
  });

});
