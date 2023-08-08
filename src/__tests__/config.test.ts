import { makeConfig } from '../config';

const defaultConfig: Record<string, string> = {
  command: 'up',
  'stack-name': 'dev',
  'work-dir': './',
  'cloud-url': 'file://~',
  'github-token': 'n/a',
  'pulumi-version': '^3',
  'comment-on-pr': 'false',
  upsert: 'false',
  remove: 'false',
  refresh: 'false',
  'edit-pr-comment': 'false',
  'expect-no-changes': 'false',
  diff: 'false',
  'target-dependents': 'false',
  'exclude-protected': 'false',
  'plan': '',
  'log-verbosity': '9',
  'tracing': 'file:./up.trace',
  'log-to-stderr': 'false',
  'debug': 'false',

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
    const c = await makeConfig();

    expect(c).toBeTruthy();
    expect(c).toMatchInlineSnapshot(`
      Object {
        "cloudUrl": "file://~",
        "command": "up",
        "commentOnPr": false,
        "commentOnPrNumber": undefined,
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
          "target": Array [],
          "targetDependents": false,
          "userAgent": "pulumi/actions@v3",
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

    await expect(() => makeConfig()).toThrowErrorMatchingInlineSnapshot(
      `"Input was not correct for command. Valid alternatives are: up, update, refresh, destroy, preview"`,
    );
  });
});
