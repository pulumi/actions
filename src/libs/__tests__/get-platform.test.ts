import { jest } from '@jest/globals';
import * as playback from 'jest-playback';
playback.setup();

const platform = jest.fn<() => string>();
const arch = jest.fn<() => string>();
jest.unstable_mockModule('os', () => ({
  platform,
  arch,
  homedir: jest.fn(() => '/home/test'),
}));

const { getPlatform } = await import('../pulumi-cli');

describe('get-platform', () => {
  it.each([
    ['darwin', 'x64', 'darwin-x64'],
    ['darwin', 'arm64', 'darwin-arm64'],
    ['darwin', 'ia32', undefined],
    ['linux', 'x64', 'linux-x64'],
    ['linux', 'arm64', 'linux-arm64'],
    ['linux', 'ia32', undefined],
    ['win32', 'x64', 'windows-x64'],
    ['win32', 'arm64', 'windows-arm64'],
    ['win32', 'ia32', undefined],
    ['android', 'ia32', undefined],
  ] as const)(
    'should return platform for %s %s',
    async (platformName, archName, expected) => {
      platform.mockReturnValue(platformName);
      arch.mockReturnValue(archName);

      const p = getPlatform();
      expect(p).toEqual(expected);
    },
  );
});
