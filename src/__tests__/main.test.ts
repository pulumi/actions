import { main } from '../main';

jest.mock('@pulumi/pulumi/x/automation');

const env = process.env;

const setInputs = (inputs: Record<string, string>) => {
  for (const [name, value] of Object.entries(inputs)) {
    process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] = value;
  }
};

describe('main', () => {
  beforeAll(() => {
    process.env = env;
  });
  it('should run without failing', async () => {
    process.env.GITHUB_WORKSPACE = '/tmp'
    setInputs({
      command: 'preview',
      'stack-name': 'dev',
    });
    expect(await main()).toBeTruthy();
  });
  it('should preview', async () => {
    process.env.GITHUB_WORKSPACE = '/tmp';
    setInputs({
      command: 'preview',
      'stack-name': 'dev',
      preview: 'true',
    });
    expect(await main()).toBeTruthy();
  });
});
