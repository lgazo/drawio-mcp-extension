// Extension Configuration interface (minimal - only URL patterns for content script injection)
export interface ExtensionConfig {
  urlPatterns: string[];
}

import { safeMigrateConfig } from './utils/configMigration';

// Default configuration (only URL patterns now)
export const DEFAULT_CONFIG: ExtensionConfig = {
  urlPatterns: ["*://app.diagrams.net/*"],
};

// Storage key
export const CONFIG_STORAGE_KEY = 'drawio-mcp-config';

/**
 * Load extension configuration from storage, apply migration, or return defaults
 * Note: WebSocket port configuration moved to plugin (localStorage)
 */
export async function getConfig(): Promise<ExtensionConfig> {
  try {
    const storage = browser.storage.sync || browser.storage.local;
    const result = await storage.get(CONFIG_STORAGE_KEY);

    if (result && result[CONFIG_STORAGE_KEY]) {
      const storedConfig = result[CONFIG_STORAGE_KEY];

      // Migrate config (removes websocketPort, keeps urlPatterns)
      const migratedConfig = safeMigrateConfig(storedConfig);

      // Return migrated config
      return migratedConfig;
    }
  } catch (error) {
    console.warn('[config] Failed to load config from storage:', error);
  }

  // Return defaults if storage fails or is invalid
  return { ...DEFAULT_CONFIG };
}

/**
 * Save extension configuration to storage
 */
export async function saveConfig(config: ExtensionConfig): Promise<void> {
  try {
    const storage = browser.storage.sync || browser.storage.local;
    await storage.set({
      [CONFIG_STORAGE_KEY]: config
    });
  } catch (error) {
    console.error('[config] Failed to save config to storage:', error);
    throw error;
  }
}

/**
 * Reset extension configuration to defaults
 */
export async function resetConfigToDefaults(): Promise<void> {
  await saveConfig({ ...DEFAULT_CONFIG });
}
