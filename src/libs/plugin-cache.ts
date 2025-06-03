import * as crypto from 'crypto';
import * as os from 'os';
import * as path from 'path';
import * as cache from '@actions/cache';
import * as core from '@actions/core';

export interface PluginCacheConfig {
  enabled: boolean;
  pluginsPath: string;
}

/**
 * Resolves the plugins path by expanding home directory if needed
 */
export function resolvePluginsPath(pluginsPath: string): string {
  if (pluginsPath.startsWith('~/')) {
    return path.join(os.homedir(), pluginsPath.slice(2));
  }
  return pluginsPath;
}

/**
 * Generates a cache key for plugins based on the runner OS and a content hash
 */
export function generateCacheKey(
  stackName: string,
  workDir: string,
  pulumiVersion: string,
): string {
  // Create a hash based on stack name, work directory, and Pulumi version
  // This ensures different projects/stacks can have different plugin requirements
  const content = `${stackName}-${workDir}-${pulumiVersion}`;
  const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 8);
  
  return `pulumi-plugins-${process.platform}-${hash}`;
}

/**
 * Generates restore keys for cache fallbacks
 */
export function generateRestoreKeys(): string[] {
  return [
    `pulumi-plugins-${process.platform}-`,
    'pulumi-plugins-',
  ];
}

/**
 * Attempts to restore plugins from cache
 */
export async function restorePluginsCache(
  cacheConfig: PluginCacheConfig,
  cacheKey: string,
): Promise<string | undefined> {
  if (!cacheConfig.enabled) {
    core.debug('Plugin caching is disabled');
    return undefined;
  }

  const resolvedPath = resolvePluginsPath(cacheConfig.pluginsPath);
  const restoreKeys = generateRestoreKeys();

  core.info(`Attempting to restore plugins cache from: ${resolvedPath}`);
  core.debug(`Cache key: ${cacheKey}`);
  core.debug(`Restore keys: ${restoreKeys.join(', ')}`);

  try {
    const cacheHit = await cache.restoreCache([resolvedPath], cacheKey, restoreKeys);
    
    if (cacheHit) {
      core.info(`Plugins cache restored successfully. Cache hit: ${cacheHit}`);
      return cacheHit;
    } else {
      core.info('No plugins cache found. Plugins will be downloaded as needed.');
      return undefined;
    }
  } catch (error) {
    core.warning(`Failed to restore plugins cache: ${error.message}`);
    return undefined;
  }
}

/**
 * Saves plugins to cache after Pulumi operations
 */
export async function savePluginsCache(
  cacheConfig: PluginCacheConfig,
  cacheKey: string,
  restoredCacheKey?: string,
): Promise<void> {
  if (!cacheConfig.enabled) {
    core.debug('Plugin caching is disabled');
    return;
  }

  // Don't save cache if we had a perfect cache hit
  if (restoredCacheKey === cacheKey) {
    core.info('Cache hit was exact, skipping cache save');
    return;
  }

  const resolvedPath = resolvePluginsPath(cacheConfig.pluginsPath);

  core.info(`Attempting to save plugins cache to: ${resolvedPath}`);
  core.debug(`Cache key: ${cacheKey}`);

  try {
    const cacheId = await cache.saveCache([resolvedPath], cacheKey);
    core.info(`Plugins cache saved successfully. Cache ID: ${cacheId}`);
  } catch (error) {
    // Cache save failures shouldn't fail the entire action
    core.warning(`Failed to save plugins cache: ${error.message}`);
  }
}