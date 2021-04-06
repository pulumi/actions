import { makeEnv } from '../envs';

describe('env variables', () => {
  beforeEach(() => {
    delete process.env.GITHUB_WORKSPACE;
    delete process.env.PULUMI_ACCESS_TOKEN;
  });
  it('should resolve environment variables', () => {
    process.env.GITHUB_WORKSPACE =
      '/home/runner/work/my-repo-name/my-repo-name';
    const env = makeEnv();
    expect(env).toMatchInlineSnapshot(`
      Object {
        "GITHUB_WORKSPACE": "/home/runner/work/my-repo-name/my-repo-name",
        "PULUMI_ACCESS_TOKEN": undefined,
      }
    `);
  });

  it('should fail if GITHUB_WORKSPACE is missing', () => {
    const env = () => makeEnv();
    expect(env).toThrowErrorMatchingInlineSnapshot(
      `"Expected string, but was undefined in GITHUB_WORKSPACE"`,
    );
  });
});
