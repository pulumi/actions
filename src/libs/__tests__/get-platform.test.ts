import * as os from 'os';
import * as playback from 'jest-playback';
import { getPlatform } from '../pulumi-cli';
playback.setup(__dirname);

jest.mock('os');

const mockedOs = jest.mocked(os);

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
    async (platform, arch, expected) => {
      mockedOs.platform.mockReturnValue(platform);
      mockedOs.arch.mockReturnValue(arch);

      const p = getPlatform();
      expect(p).toEqual(expected);
    },
  );
});
