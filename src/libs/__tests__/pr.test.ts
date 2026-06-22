import { jest } from '@jest/globals';
import { Config } from '../../config';

const comments = [
  {
    id: 2,
    body: '#### :tropical_drink: `preview` on myFirstProject/staging. <summary>Pulumi report</summary>',
  },
];
const resp = { data: comments };
const projectName = 'myFirstProject';
const defaultOptions = {
  command: 'preview',
  stackName: 'staging',
  options: {},
} as Config;
const createComment = jest.fn();
const updateComment = jest.fn();
const listComments = jest.fn(() => resp);

// ESM module namespaces are read-only, so the github context cannot be
// reassigned per test as it was under CommonJS. Mock it with a mutable object
// and rewrite its contents through setContext instead.
const context: Record<string, unknown> = {};
function setContext(value: Record<string, unknown>) {
  for (const key of Object.keys(context)) {
    delete context[key];
  }
  Object.assign(context, value);
}

jest.unstable_mockModule('@actions/github', () => ({
  context,
  getOctokit: jest.fn(() => ({
    rest: {
      issues: {
        createComment,
        listComments,
        updateComment,
      },
    },
  })),
}));

const { handlePullRequestMessage } = await import('../pr');

describe('pr.ts', () => {
  beforeEach(() => {
    createComment.mockClear();
    updateComment.mockClear();
    setContext({});
  });
  it('should add pull request message', async () => {
    setContext({
      payload: {
        pull_request: {
          number: 123,
        },
      },
    });

    process.env.GITHUB_REPOSITORY = 'pulumi/actions';

    await handlePullRequestMessage(defaultOptions, projectName, 'test');
    expect(createComment).toHaveBeenCalledWith({
      body: `#### :tropical_drink: \`preview\` on ${projectName}/${defaultOptions.stackName}\n\n<details>\n<summary>Pulumi report</summary>\n\n\n<pre>\ntest\n</pre>\n\n</details>`,
      issue_number: 123,
    });
  });

  it('should convert ansi control character to plain text and add to pull request message', async () => {
    setContext({
      payload: {
        pull_request: {
          number: 123,
        },
      },
    });

    process.env.GITHUB_REPOSITORY = 'pulumi/actions';

    await handlePullRequestMessage(defaultOptions, projectName, '\x1b[30mblack\x1b[37mwhite');
    expect(createComment).toHaveBeenCalledWith({
      body: `#### :tropical_drink: \`preview\` on ${projectName}/${defaultOptions.stackName}\n\n<details>\n<summary>Pulumi report</summary>\n\n\n<pre>\nblackwhite\n</pre>\n\n</details>`,
      issue_number: 123,
    });
  });

  it('should add pull request message to the PR defined in config, overriding the github context', async () => {
    setContext({
      payload: {
        pull_request: {
          number: 123,
        },
      },
    });

    const options: Config = {
      ...defaultOptions,
      commentOnPrNumber: 87,
    };

    process.env.GITHUB_REPOSITORY = 'pulumi/actions';

    await handlePullRequestMessage(options, projectName, 'test');
    expect(createComment).toHaveBeenCalledWith({
      body: `#### :tropical_drink: \`preview\` on ${projectName}/${options.stackName}\n\n<details>\n<summary>Pulumi report</summary>\n\n\n<pre>\ntest\n</pre>\n\n</details>`,
      issue_number: 87,
    });
  });

  it('should fail if no pull request data, and no PR number in config', async () => {
    process.env.GITHUB_REPOSITORY = 'pulumi/actions';
    setContext({ payload: {} });
    await expect(
      handlePullRequestMessage(defaultOptions, projectName, 'test'),
    ).rejects.toThrow('Missing pull request event data');
  });

  it('should add pull request message to the PR defined in config, if no pull request data', async () => {
    setContext({ payload: {} });

    const options: Config = {
      ...defaultOptions,
      commentOnPrNumber: 87,
    };

    process.env.GITHUB_REPOSITORY = 'pulumi/actions';

    await handlePullRequestMessage(options, projectName, 'test');
    expect(createComment).toHaveBeenCalledWith({
      body: `#### :tropical_drink: \`preview\` on ${projectName}/${options.stackName}\n\n<details>\n<summary>Pulumi report</summary>\n\n\n<pre>\ntest\n</pre>\n\n</details>`,
      issue_number: 87,
    });
  });

  it('should trim the output when the output is larger than 64k characters', async () => {
    process.env.GITHUB_REPOSITORY = 'pulumi/actions';
    setContext({
      payload: {
        pull_request: {
          number: 123,
        },
      },
    });

    await handlePullRequestMessage(
      defaultOptions,
      projectName,
      'a'.repeat(65_000),
    );

    const call = createComment.mock.calls[0][0] as { body: string };
    expect(call.body.length).toBeLessThan(65_536);
    expect(call.body).toContain('The output was too long and trimmed.');
    expect(call.body).not.toContain('The output was too long and trimmed from the front.');
  });

  it('should trim the output from front when the output is larger than 64k characters and config is set', async () => {
    process.env.GITHUB_REPOSITORY = 'pulumi/actions';
    setContext({
      payload: {
        pull_request: {
          number: 123,
        },
      },
    });

    const options: Config = {
      ...defaultOptions,
      alwaysIncludeSummary: true,
    };

    await handlePullRequestMessage(
      options,
      projectName,
      'a'.repeat(65_000) + '\n' + 'this is at the end and should be in the output',
    );

    const call = createComment.mock.calls[0][0] as { body: string };
    expect(call.body.length).toBeLessThan(65_536);
    expect(call.body).toContain('this is at the end and should be in the output');
    expect(call.body).toContain('The output was too long and trimmed from the front.');
    expect(call.body).not.toContain('The output was too long and trimmed.');
  });

  it('should edit the comment if it finds a previous created one', async () => {
    setContext({ repo: {} });

    const options: Config = {
      ...defaultOptions,
      commentOnPrNumber: 123,
      editCommentOnPr: true,
    };

    await handlePullRequestMessage(options, projectName, 'test');
    expect(updateComment).toHaveBeenCalledWith({
      comment_id: 2,
      body: `#### :tropical_drink: \`preview\` on ${projectName}/${options.stackName}\n\n<details>\n<summary>Pulumi report</summary>\n\n\n<pre>\ntest\n</pre>\n\n</details>`,
    });
  });

  it('should add a clickable link to the update run', async () => {
    setContext({
      payload: {
        pull_request: {
          number: 123,
        },
      },
    });

    const options: Config = {
      ...defaultOptions,
      commentOnPrNumber: 87,
    };

    await handlePullRequestMessage(options, projectName, 'View Live: https://example.com/update/1\ntest');
    expect(createComment).toHaveBeenCalledWith({
      body: '#### :tropical_drink: `preview` on myFirstProject/staging\n\n<details>\n<summary>Pulumi report</summary>\n\n[View in Pulumi Cloud](https://example.com/update/1)\n\n\n<pre>\nView Live: https://example.com/update/1\ntest\n</pre>\n\n</details>',
      issue_number: 87,
    });
  });
});
