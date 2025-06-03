import * as os from 'os';
import * as path from 'path';
import {
  generateCacheKey,
  generateRestoreKeys,
  resolvePluginsPath,
} from '../plugin-cache';

// Mock @actions/cache to avoid node:stream dependency issues in tests
jest.mock('@actions/cache', () => ({
  restoreCache: jest.fn(),
  saveCache: jest.fn(),
}));

describe('plugin-cache', () => {
  describe('resolvePluginsPath', () => {
    it('should expand home directory path', () => {
      const pluginsPath = '~/.pulumi/plugins';
      const resolved = resolvePluginsPath(pluginsPath);
      expect(resolved).toBe(path.join(os.homedir(), '.pulumi/plugins'));
    });

    it('should return absolute path as-is', () => {
      const pluginsPath = '/home/user/.pulumi/plugins';
      const resolved = resolvePluginsPath(pluginsPath);
      expect(resolved).toBe(pluginsPath);
    });

    it('should return relative path as-is', () => {
      const pluginsPath = './plugins';
      const resolved = resolvePluginsPath(pluginsPath);
      expect(resolved).toBe(pluginsPath);
    });
  });

  describe('generateCacheKey', () => {
    it('should generate consistent cache keys', () => {
      const stackName = 'dev';
      const workDir = '/workspace';
      const pulumiVersion = '3.85.0';

      const key1 = generateCacheKey(stackName, workDir, pulumiVersion);
      const key2 = generateCacheKey(stackName, workDir, pulumiVersion);

      expect(key1).toBe(key2);
      expect(key1).toMatch(/^pulumi-plugins-\w+-[a-f0-9]{8}$/);
    });

    it('should generate different keys for different inputs', () => {
      const key1 = generateCacheKey('dev', '/workspace1', '3.85.0');
      const key2 = generateCacheKey('prod', '/workspace1', '3.85.0');
      const key3 = generateCacheKey('dev', '/workspace2', '3.85.0');
      const key4 = generateCacheKey('dev', '/workspace1', '3.86.0');

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key1).not.toBe(key4);
    });

    it('should include platform in cache key', () => {
      const key = generateCacheKey('dev', '/workspace', '3.85.0');
      expect(key).toContain(`pulumi-plugins-${process.platform}`);
    });
  });

  describe('generateRestoreKeys', () => {
    it('should return fallback keys in correct order', () => {
      const restoreKeys = generateRestoreKeys();
      
      expect(restoreKeys).toHaveLength(2);
      expect(restoreKeys[0]).toBe(`pulumi-plugins-${process.platform}-`);
      expect(restoreKeys[1]).toBe('pulumi-plugins-');
    });
  });
});