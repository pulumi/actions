import * as os from 'os'
import * as playback from 'jest-playback'
import { mocked } from 'ts-jest/utils'
import { getPlatform } from '../pulumi-cli'
playback.setup(__dirname)

jest.mock('os')

const mockedOs = mocked(os)

describe('get-platform', () => {
  it.each(
    [
      ['darwin', 'x64', 'darwin-x64'],
      ['darwin', 'arm64', 'darwin-arm64'],
      ['darwin', 'x32', undefined],
      ['linux', 'x64', 'linux-x64'],
      ['linux', 'arm64', 'linux-arm64'],
      ['linux', 'x32', undefined],
      ['win32', 'x64', 'windows-x64'],
      ['win32', 'x32', undefined],
      ['android', 'x32', undefined],
    ] as const,
  )(
    'should return platform for %s %s',
    async (platform, arch, expected) => {
      mockedOs.platform.mockReturnValue(platform)
      mockedOs.arch.mockReturnValue(arch)

      const p = getPlatform()
      expect(p).toEqual(expected)
    },
  )
})
